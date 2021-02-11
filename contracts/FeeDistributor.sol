pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import './owner/Operator.sol';
import './interfaces/IFeeDistributor.sol';
import './interfaces/IBoardroomv2.sol';

contract FeeDistributor is IFeeDistributor, Operator {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;

    //first address tokens get transferred to
    address public boardroomAddress; 
    //% of tokens that get transferred to first address (1 = 0.1%)
    uint256 public boardroomAddressPercent = 500; 
    //% of tokens sent to first address that get transferred to the fund reserve (1 = 0.1%)
    uint256 public fundAllocationRate = 10;
    //The fund reserve
    address public fundAddress;
    //setting this to an address no one has the private keys to like 0x0000000000000000000000000000000000000001 basically burns the tokens
    address public secondTransferAddress; 

    event FeeAdded(uint256 amount);

    constructor(address _tokenAddress) public {
        token = IERC20(_tokenAddress);
    }

    // The _transfer function in the token contract calls this to let the fee contract know that it received the specified amount of tokens to be distributed
    function addFee(uint256 amount) 
        external 
        override 
    {
        require(msg.sender == address(token));
        
        uint256 boardroomAddressAmount = amount.mul(boardroomAddressPercent).div(1000);
        uint256 secondTransferAddressAmount = amount.sub(boardroomAddressAmount);
        
        uint256 fundReserveAmount = boardroomAddressAmount.mul(fundAllocationRate).div(1000);
        if (fundReserveAmount > 0) {
            //using ISimpleERCFund(fund).deposit() would consume more gas, not sure if that is needed
            _safeTransfer(fundAddress, fundReserveAmount);
            boardroomAddressAmount = boardroomAddressAmount.sub(fundReserveAmount);
        }
        
        if(boardroomAddressAmount > 0) {
            token.safeApprove(boardroomAddress, 0);
            token.safeApprove(boardroomAddress, boardroomAddressAmount);
            IBoardroomv2(boardroomAddress).addClaimableTaxes(boardroomAddressAmount);
        }
        if(secondTransferAddressAmount > 0) {
            _safeTransfer(secondTransferAddress, secondTransferAddressAmount);
        }
        emit FeeAdded(amount);
    }

    // Internal function to safely transfer tokens in case there is a rounding error
    function _safeTransfer(address _to, uint256 _amount) 
        internal 
    {
        uint256 tokenBalance = token.balanceOf(address(this));
        if (_amount > tokenBalance) {
            token.transfer(_to, tokenBalance);
        } else {
            token.transfer(_to, _amount);
        }
    }

    /* ========== GOVERNANCE ========== */
    
    function setBoardroomAddress(address _address) public onlyOperator {
        boardroomAddress = _address;
    }
    
    function setBoardroomAddressPercent(uint256 _amount) public onlyOperator {
        require(_amount < 1000);
        boardroomAddressPercent = _amount;
    }

    function setFundAddress(address _address) public onlyOperator {
        fundAddress = _address;
    }

    function setFundAllocationRate(uint256 _rate) public onlyOperator {
        require(_rate < 1000);
        fundAllocationRate = _rate;
    }

    function setSecondTransferAddress(address _address) public onlyOperator {
        secondTransferAddress = _address;
    }
}
