pragma solidity ^0.6.0;

interface ISharePoolFeeDistributor {

    //Calculated the fee amount from the amount of earned rewards
    function calculateFeeAmount(uint256 amount) 
        external
        view 
        returns (uint256 feeAmount);

    // The updateReward function in the share pool contract calls this to let the fee contract know the fee amount
    function addFee(uint256 amount) external;

    function setFeeTransferAddress(address _address) public;

    function setFeePercent(uint256 _percent) public;
}