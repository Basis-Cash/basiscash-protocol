pragma solidity ^0.5.0;

import './token/ERC20.sol';
import './owner/Ownable.sol';
import './guards/ReentrancyGuard.sol';

contract BasisCash is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    // addresses for operators
    address public basisBank;

    /**
     * @notice Constructs the Basis cash ERC-20 contract. 
     * @param bank_ The address of the bank contract
     */
    constructor(address bank_) public ERC20Detailed("basis cash", "basiscash.cash", 18) {
        basisBank = bank_;
    }
    
    /**
     * @notice Burns basis cash from an account
     * @param from_ The address of an account to burn from
     * @param amount_ The amount of basis cash to burn
     * @return whether the process has been done
     */
    function burn(address from_, uint256 amount_) public returns (bool) {
        uint256 balanceBefore = balanceOf(from_);
        _burnFrom(from_, amount_);
        uint256 balanceAfter = balanceOf(from_);
        return balanceBefore > balanceAfter;
    }
    
    /**
     * @notice Burns basis cash of an account from the operator 
     * @param from_ The address of an account to burn from
     * @param amount_ The amount of basis cash to burn
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
            "basis.cash: new operator is the zero address"
        );
        basisBank = newBank;
    }
    
    /** Operator functions **/
    
    modifier onlyOperator() {
        require(basisBank == msg.sender, "basis.cash: caller is not the operator");
        _;
    }
    
    /**
     * @notice Operator mints basis cash to a recipient
     * @param recipient_ The address of recipient
     * @param amount_ The amount of basis cash to mint to 
     * @return whether the process has been done
     */
    function mint(address recipient_, uint256 amount_) public onlyOperator returns (bool) {
        uint256 balanceBefore = balanceOf(recipient_);
        _mint(recipient_, amount_);
        uint256 balanceAfter = balanceOf(recipient_);
        
        return balanceAfter > balanceBefore;
    }
}