pragma solidity ^0.5.0;

import './token/ERC20.sol';
import './owner/Ownable.sol';
import './guards/ReentrancyGuard.sol';

contract Bond is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    // addresses for operators
    address public treasury;

    /**
     * @notice Constructs the Basis Bond ERC-20 contract. 
     * @param treasury_ The address of the treasury contract
     */
    constructor(address treasury_) public ERC20Detailed("basis bond", "BAB", 18) {
        treasury = treasury_;
    }
    
    /**
     * @notice Burns basis bonds from an account
     * @param from_ The address of an account to burn from
     * @param amount_ The amount of basis bonds to burn
     * @return whether the process has been done
     */
    function burn(address from_, uint256 amount_) public returns (bool) {
        uint256 balanceBefore = balanceOf(from_);
        _burnFrom(from_, amount_);
        uint256 balanceAfter = balanceOf(from_);
        return balanceBefore > balanceAfter;
    }
    
    /**
     * @notice Burns basis bonds of an account from the operator 
     * @param from_ The address of an account to burn from
     * @param amount_ The amount of basis bonds to burn
     * @return whether the process has been done
     */
    function burnFrom(address from_, uint256 amount_) public returns (bool) {
         uint256 balanceBefore = balanceOf(from_);
        _burnFrom(from_, amount_);
         uint256 balanceAfter = balanceOf(from_);
         return balanceBefore > balanceAfter;
    }
    
    /** Admin functions **/
    
    /**
     * @notice Transfer operators to new ones
     * @param newTreasury_ The address of the new Treasury contract
     */
    function transferOperators(address newTreasury_) public onlyOwner {
        _transferOperators(newTreasury_);
    }

    function _transferOperators(address newTreasury) internal {
        require(
            newTreasury != address(0),
            "basis.bond: zero address given for new operator"
        );
        treasury = newTreasury;
    }
    
    /** Operator functions **/
    
    modifier onlyOperator() {
        require(treasury == msg.sender, "basis.bond: caller is not the operator");
        _;
    }
    
    /**
     * @notice Operator mints basis bonds to a recipient
     * @param recipient_ The address of recipient
     * @param amount_ The amount of basis bonds to mint to 
     * @return whether the process has been done
     */
    function mint(address recipient_, uint256 amount_) public onlyOperator returns (bool) {
        uint256 balanceBefore = balanceOf(recipient_);
        _mint(recipient_, amount_);
        uint256 balanceAfter = balanceOf(recipient_);
        
        return balanceAfter > balanceBefore;
    }
}
