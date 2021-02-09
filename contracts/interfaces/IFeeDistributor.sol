pragma solidity ^0.6.0;

interface IFeeDistributor {

    // The _transfer function in the token contract calls this to let the distributor contract know that it received the specified amount of tokens to be distributed
    function addFee(uint256 amount) external;
}