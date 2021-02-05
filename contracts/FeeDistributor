pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './owner/Operator.sol';
import './interfaces/IFeeDistributor.sol';

contract FeeDistributor is IFeeDistributor, Operator {
    using SafeMath for uint256;

    IERC20 public token;

    //first address tokens get transferred to
    address public firstTransferAddress; 
    //% of tokens that get transferred to first address (1 = 0.1%)
    uint256 public firstTransferAddressPercent = 500; 
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
        
        uint256 firstTransferAddressAmount = amount.mul(firstTransferAddressPercent).div(1000);
        uint256 secondTransferAddressAmount = amount.sub(firstTransferAddressAmount);
        
        uint256 fundReserveAmount = firstTransferAddressAmount.mul(fundAllocationRate).div(1000);
        if (fundReserveAmount > 0) {
            //using ISimpleERCFund(fund).deposit() would consume more gas, not sure if that is needed
            _safeTransfer(fundAddress, fundReserveAmount);
            firstTransferAddressAmount = firstTransferAddressAmount.sub(fundReserveAmount);
        }
        
        if(firstTransferAddressAmount > 0) {
            //Change to whatever method the boardroom uses i.e. addClaimableTaxes
            _safeTransfer(firstTransferAddress, firstTransferAddressAmount);
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
    
    function setFirstTransferAddress(address _address) public onlyOperator {
        firstTransferAddress = _address;
    }
    
    function setFirstTransferAddressPercent(uint256 _amount) public onlyOperator {
        require(_amount < 1000);
        firstTransferAddressPercent = _amount;
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
