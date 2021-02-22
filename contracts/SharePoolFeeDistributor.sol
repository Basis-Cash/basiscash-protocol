pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './owner/Operator.sol';
import './Whitelist.sol';

contract SharePoolFeeDistributor is Whitelist, Operator {
    using SafeMath for uint256;

    IERC20 public share;

    //fee address share gets transferred to
    address public feeTransferAddress; 
    //% of share that gets transferred to first address (1 = 0.01%)
    uint256 public feePercent = 5000;

    // address of mic-usdt share pool address
    address public daiMicSharePoolAddress;
    // address of mis-usdt share pool address
    address public daiMisSharePoolAddress;
    
    event FeeAdded(uint256 amount);

    constructor(address _shareAddress, address _daiMicSharePoolAddress, address _daiMisSharePoolAddress) public {
        share = IERC20(_shareAddress);
        daiMicSharePoolAddress = _daiMicSharePoolAddress;
        daiMisSharePoolAddress = _daiMisSharePoolAddress;
    }

    //Calculated the fee amount from the amount of earned rewards
    function calculateFeeAmount(uint256 amount) 
        external 
        override
        view 
        returns (uint256 feeAmount)
    {
        feeAmount = amount.mul(feePercent).div(10000);
    }

    // The updateReward function in the share pool contract calls this to let the fee contract know the fee amount
    function addFee(uint256 amount) 
        external 
        override 
    {
        require(msg.sender == daiMicSharePoolAddress || msg.sender == daiMisSharePoolAddress);
        require(amount > 0, 'Fee should be larger than zero');
        
        _safeTransfer(feeTransferAddress, amount);
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
    
    function setFeeTransferAddress(address _address) public onlyWhitelisted {
        feeTransferAddress = _address;
    }

    function setFeePercent(uint256 _percent) public onlyWhitelisted {
        require(_percent < 10000);
        feePercent = _percent;
    }
}
