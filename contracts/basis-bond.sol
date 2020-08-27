pragma solidity ^0.5.0;

import './token/ERC20.sol';
import './owner/Ownable.sol';
import './guards/ReentrancyGuard.sol';

contract BasisBond is ERC20, ERC20Detailed, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    // addresses for operators
    address public basisBank;
    address public basisStabilizer;

    /**
     * @notice Construct a new bank for basis assets
     * @param bank_ The address of the bank contract
     * @param stablizer_ The address of the stabilizer contract
     */
    constructor(address bank_, address stablizer_) public ERC20Detailed("basis basis.bond", "basis.bond", 18) {
        basisBank = bank_;
        basisStabilizer = stablizer_;
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
     * @param newStabilizer_ The address of the stabilizer contract
     */
    function transferOperators(address newBank_, address newStabilizer_) public onlyOwner {
        _transferOperators(newBank_, newStabilizer_);
    }

    function _transferOperators(address newBank, address newStabilizer) internal {
        require(
            newBank != address(0) && newStabilizer != address(0),
            "basis.bond: new operator is the zero address"
        );
        basisBank = newBank;
        basisStabilizer = newStabilizer;
    }
    
    /** Operator functions **/
    
    modifier onlyOperator() {
        require(basisBank == msg.sender || basisStabilizer == msg.sender, "basis.bond: caller is not the operator");
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