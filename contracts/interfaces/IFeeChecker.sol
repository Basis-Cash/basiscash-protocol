pragma solidity ^0.6.0;

interface IFeeChecker {

    function isTransferTaxed(address sender, address recipient) external view returns (bool);

    function calculateFeeAmount(address sender, address recipient, uint256 amount) external view returns (uint256 feeAmount);
}
