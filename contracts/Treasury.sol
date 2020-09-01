pragma solidity ^0.5.0;

import './interfaces/IBasisAsset.sol';
import './interfaces/IERC20.sol';
import './interfaces/IOracle.sol';
import './interfaces/IBoardroom.sol';

import './owner/Ownable.sol';
import './lib/Safe112.sol';
import './lib/SafeERC20.sol';
import './guards/ReentrancyGuard.sol';


/**
 * @title Basis Cash Treasury contract
 * @notice Monetary policy logic to adjust supplies of basis cash assets
 * @author Summer Smith & Rick Sanchez 
 */
contract Treasury is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    /* ========== STATE VARIABLES ========== */

    address private cash;
    address private bond;
    address private share;
    address private cashOracle;
    address private multidai;
    address private boardroom;

    uint256 private cashPriceCeiling;
    uint256 private bondDepletionFloor;
    uint256 private lastAllocated;


    /* ========== CONSTRUCTOR ========== */

    constructor(address _cash, 
                address _bond, 
                address _share, 
                address _cashOracle, 
                address _multidai, 
                address _boardroom) public {
        cash = _cash;
        bond = _bond;
        share = _share;
        cashOracle = _cashOracle;
        multidai = _multidai;
        boardroom = _boardroom;

        uint one = 1e18;
        cashPriceCeiling = one.add(one.div(100).mul(5));
        
        // Set the depletion threshold of the treasury to 1000 basis cash
        bondDepletionFloor = 1000e18;
        lastAllocated = now;
    }
    

    // ========== EXTERNAL SETTERS ==========

    function setCash(address _cash) external onlyOwner {
        cash = _cash;
    }

    function setBond(address _bond) external onlyOwner {
        cash = _bond;
    }

    function setShare(address _share) external onlyOwner {
        cash = _share;
    }

    function setCashOracle(address _cashOracle) external onlyOwner {
        cashOracle = _cashOracle;
    }

    function setMultiDai(address _multidai) external onlyOwner {
         multidai = _multidai;
    }

    function setBoardroom(address _boardroom) external onlyOwner {
        boardroom = _boardroom;
    }


    /* ========== MODIFIERS ========== */

    modifier allocationTimeRipe {
        require(now.sub(lastAllocated) >= 1 days, "allocationTimeRipe: a day has not passed yet");
        _;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function getCashPrice() internal returns (uint cashPrice) {
        IOracle(cashOracle).update();
        cashPrice = IOracle(cashOracle).consult(cash, 1);
    }

    /**
     * @notice Buy bonds from the system.
     * @param amount amount of cash to purchase bonds with.
     */
    function buyBonds(uint256 amount) external {
        
        // get input price from 1 multidai to basis cash
        uint256 cashPrice = getCashPrice();
        
        // Cash can be swapped to bonds at (price of basis cash) * amount
        uint256 bondPrice = cashPrice;
        
        // Burn basis cash
        (bool success) = IBasisAsset(cash).burnFrom(msg.sender, amount);
        require(
            success,
            "Treasury: insufficient allowance; need to specify a higher amount of cash to burn."
        );
        
        // Mint basis bond
        (success) = IBasisAsset(bond).mint(msg.sender, bondPrice.mul(amount));
        require(
            success,
            "Treasury: this contract is not the operator of the basis bonds contract"
        );        
        
        emit BoughtBonds(msg.sender, amount);
    }
    
    /**
     * @notice Redeem bonds for cash. 
     * @param amount amount of bonds to redeem. 
     */
    function redeemBonds(uint256 amount) external {

        // get input price from 1 multidai to basis cash
        uint256 cashPrice = getCashPrice();
        
        require (
            cashPrice >= 1, 
            "Treasury: bond redemption failed; basis cash remains depegged."
        );

        // Burn basis bonds
        (bool success) = IBasisAsset(bond).burnFrom(msg.sender, amount);
        require(
            success,
            "Treasury: insufficient allowance; need to specify a higher amount of bonds to burn."
        );
        
        // Mint basis cash
        (success) = IBasisAsset(cash).mint(msg.sender, amount);
        require(
            success,
            "Treasury: this contract is not the operator of the basis cash contract"
        );
        
        emit RedeemedBonds(msg.sender, amount);
    }

    /**
     * @notice Expansionary monetary policy. Called at most once a day. 
     */
    function allocateSeigniorage() external allocationTimeRipe {

        // get input price from 1 multidai to basis cash
        uint256 cashPrice = getCashPrice();
        
        require (
            cashPrice > cashPriceCeiling, 
            "Treasury: there is no seigniorage to be allocated"
        );

        uint256 cashSupply = IERC20(cash).totalSupply();
        uint256 seigniorage = cashSupply.mul(cashPrice.sub(1));
        uint256 treasuryBalance = IERC20(cash).balanceOf(address(this));
            
        // If the treasury is sufficiently capitalized, pay dividends to shareholders 
        if (treasuryBalance > bondDepletionFloor) {
            IBasisAsset(cash).mint(address(this), seigniorage);
            IBoardroom(boardroom).allocateSeigniorage(seigniorage);
            emit BoardroomFunded(now, seigniorage);
        } else { // replenish the treasury otherwise
            IBasisAsset(cash).mint(address(this), seigniorage);
            emit TreasuryFunded(now, seigniorage);
        }
        
        // reinitialize seigniorageLastAllocated
        lastAllocated = now;        
    }
    

    /* ========== EVENTS ========== */

    event RedeemedBonds(address indexed from, uint256 amount);
    event BoughtBonds(address indexed from, uint256 amount);
    event TreasuryFunded(uint256 timestamp, uint256 seigniorage);
    event BoardroomFunded(uint256 timestamp, uint256 seigniorage);
}
