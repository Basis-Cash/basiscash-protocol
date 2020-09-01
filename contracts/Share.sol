pragma solidity ^0.5.0;

import './token/ERC20.sol';
import './owner/Ownable.sol';
import './owner/Operator.sol';
import './guards/ReentrancyGuard.sol';


contract Share is ERC20, ERC20Detailed, ReentrancyGuard, Ownable, Operator {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    uint256 public maxSupply = 1000000e18; // 1 million
    
    constructor() public ERC20Detailed("BAS", "BAS", 18) {
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
    
    /**
     * @notice Operator mints basis cash to a recipient
     * @param recipient_ The address of recipient
     * @param amount_ The amount of basis cash to mint to 
     */
    function mint(address recipient_, uint256 amount_) public onlyOperator {
        require(totalSupply() + amount_ <= maxSupply, "Share: minting amount exceeds max supply");
        _mint(recipient_, amount_);
    }
}