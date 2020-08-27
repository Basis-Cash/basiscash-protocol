pragma solidity ^0.5.0;

import '../../interfaces/IBasisAsset.sol';
import '../../interfaces/IERC20.sol';
import '../../owner/Ownable.sol';
import '../../lib/SafeERC20.sol';
import '../../interfaces/IOracle.sol';

/**
 * @title Basis Cash's bond redemption pool contract
 * @notice Bond redemption pool for seigniorage in basis cash stablizier
 * @author Summer Smith
 */
contract BondRedemptionPool is Ownable, IOracle {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public basisCash;
        
    /**
     * @notice Construct a new bond redemption pool for basis bond
     * @param cash_ The address of the cash contract to redempt to
     */
    constructor(address cash_) public {
        basisCash = cash_;
    }
    
    /**
     * @notice Get balance of the redemption pool
     * @return Balance of the pool for basis cash
     */
    function balance() public view returns (uint256) {
        return IERC20(basisCash).balanceOf(address(this));
    }
    
    /**
     * @notice Redempt bond to earn cash from segniorage
     * @param amount_ amount of cash
     */
    function redempt(uint256 amount_) public {
        
        // Burn basis bond
        (bool success) = IBasisAsset(basisCash).burnFrom(msg.sender, amount_);
        require(
            success,
            "basis.bondRedemptionPool: insufficient allowance: the trader has not allowed not enough cash to burn from"
        );
        
        // Mint basis cash
        (success) = IERC20(basisCash).transfer(msg.sender, amount_);
        require(
            success,
            "basis.bondRedemptionPool: this contract has insufficient balance to send basis cash"
        );
            
        emit Redempt(msg.sender, amount_);
    }

    event Redempt(address indexed to, uint256 amount);
}