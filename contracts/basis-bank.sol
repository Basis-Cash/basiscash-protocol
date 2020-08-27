pragma solidity ^0.5.0;

import './interfaces/IBasisAsset.sol';
import './interfaces/IERC20.sol';
import './owner/Ownable.sol';
import './lib/Safe112.sol';
import './lib/SafeERC20.sol';
import './guards/ReentrancyGuard.sol';
import './interfaces/IBondRedemptionPool.sol';
import './interfaces/IOracle.sol';


/**
 * @title Basis Cash Bank contract
 * @notice Monetary policy logic to adjust supplies of basis cash assets
 * @author Summer Smith & Rick Sanchez 
 */
contract BasisBank is ReentrancyGuard, Ownable, IOracle {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    address public basisCash;
    address public basisBond;
    address public basisShare;
    address public cashOracle;
    address public multidai;

    address private bondRedemptionPool;
    address private seigniorageSharePool;

    uint256 private cashPriceCeiling;
    uint256 private bondDepletionFloor;
    uint256 private lastStabilized;


    /**
     * @notice Construct a new bank for basis assets
     * @param cash_ the cash ERC-20 contract
     * @param bond_ the bond ERC-20 contract
     * @param share_ the share ERC-20 contract
     * @param daiCashOracle_ the oracle to read in basis cash prices in Basis Cash / MCD pair
     * @param bondPool_ seigniorage pool earmarked for bond redemption
     * @param sharePool_ seigniorage pool earmarked for share dividends
     */
    constructor(address cash_, address bond_, address share_, address daiCashOracle_, address bondPool_, address sharePool_) public {
        basisCash = cash_;
        basisBond = bond_;
        basisShare = share_;
        daiCashOracle = daiCashOracle_;

        bondRedemptionPool = bondPool_;
        seigniorageSharePool = sharePool_;

        uint one = 1e18;
        cashPriceCeiling = one.add(one.div(100).mul(5));
        bondDepletionFloor = 1000e18;

        lastStabilized = now;
    }

    /* Checks that the stabilizer is run at most once a day */ 
    modifier canStabilize {
        require(now.sub(lastStabilized) >= 1 days, "canStabilize: a day has not passed yet");
        _;
    }
    

    /**
     * @notice Buy bonds from the system.
     * @param amount_ amount of cash to purchase bonds with.
     */
    function buyBonds(uint256 amount_) public {
        
        uint one = 1e18;

        // get input price from 1 multidai to basis cash
        uint256 cashPrice = IOracle(cashOracle).consult(multidai, one);
        
        // Cash can be swapped to bonds at (price of basis cash) * amount
        uint256 bondPrice = cashPrice;
        
        // Burn basis cash
        (bool success) = IBasisAsset(basisCash).burnFrom(msg.sender, amount_);
        require(
            success,
            "basis.bank: insufficient allowance; need to specify a higher amount of cash to burn."
        );
        
        // Mint basis bond
        (success) = IBasisAsset(basisBond).mint(msg.sender, bondPrice.mul(amount_));
        require(
            success,
            "basis.bank: this contract is not the operator of the basis bonds contract"
        );        
        
        emit BuyBonds(msg.sender, amount_);
    }
    
    /**
     * @notice Redeem bonds for cash. 
     * @param amount_ amount of bonds to redeem. 
     */
    function redeemBonds(uint256 amount_) public {
        
        uint one = 1e18;

        // get input price from 1 multidai to basis cash
        uint256 cashPrice = IOracle(cashOracle).consult(multidai, one);
        
        bool depegged = cashPrice < one; 
        require (
            !depegged, 
            "basis.bank: bond redemption failed; basis cash remains depegged."
        );

        // Burn basis bonds
        (bool success) = IBasisAsset(basisBond).burnFrom(msg.sender, amount_);
        require(
            success,
            "basis.bank: insufficient allowance; need to specify a higher amount of bonds to burn."
        );
        
        // Mint basis cash
        (success) = IBasisAsset(basisCash).mint(msg.sender, amount_);
        require(
            success,
            "basis.bank: this contract is not the operator of the basis cash contract"
        );
        
        emit RedeemBonds(msg.sender, amount_);
    }

    /* Adjusts cash supply to stabilize cash price. Called at most once a day. */
    function stabilize() public canStabilize {

        uint one = 1e18;

        // get price of 1 basisCash in basis cash / multidai pair oracle
        uint basisPrice = IOracle(cashOracle).consult(basisCash, one);
        
        // if basisPrice > 1 + epsilion, then mint basis cash
        if(basisPrice > cashPriceCeiling) {
            uint256 cashSupply = IERC20(basisCash).totalSupply();
            uint256 seigniorage = cashSupply.mul(basisPrice.sub(one));
            uint256 redemptionPoolBalance = IBondRedemptionPool(bondRedemptionPool).balance();
            
            // If the bond pool is sufficiently capitalized, pay dividends to shareholders 
            if (redemptionPoolBalance > bondDepletionFloor) {
                IBasisAsset(basisCash).mint(seigniorageSharePool, seigniorage);
                emit Stabilize(now, seigniorage, seigniorageSharePool);
            } else { // replenish the bond pool otherwise 
                IBasisAsset(basisCash).mint(bondRedemptionPool, seigniorage);
                emit Stabilize(now, seigniorage, bondRedemptionPool);
            }
        } 

        // reinitialize lastStabilized
        lastStabilized = now;        
    }
    

    /** Events */
    event BuyBonds(address indexed from, uint256 amount);
    event RedeemBonds(address indexed from, uint256 amount);
    event Stabilize(uint256 timestamp, uint256 seigniorage, address where);
}
