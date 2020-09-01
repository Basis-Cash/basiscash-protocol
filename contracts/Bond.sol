pragma solidity ^0.5.0;

import './token/ERC20.sol';
import './owner/Ownable.sol';
import './guards/ReentrancyGuard.sol';

contract Bond is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    // addresses for operators
    address public basisBank;

    /**
     * @notice Constructs the Basis Bond ERC-20 contract. 
     * @param bank_ The address of the bank contract
     */
    constructor(address bank_) public ERC20Detailed("basis bond", "BAB", 18) {
        basisBank = bank_;
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
     * @param newBank_ The address of the bank contract
     */
    function transferOperators(address newBank_) public onlyOwner {
        _transferOperators(newBank_);
    }

    function _transferOperators(address newBank) internal {
        require(
            newBank != address(0),
            "basis.bond: new operator is the zero address"
        );
        basisBank = newBank;
    }
    
    /** Operator functions **/
    
    modifier onlyOperator() {
        require(basisBank == msg.sender, "basis.bond: caller is not the operator");
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