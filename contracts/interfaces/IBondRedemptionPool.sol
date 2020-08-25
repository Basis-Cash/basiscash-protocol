pragma solidity ^0.5.0;

interface IBondRedemptionPool {
    function redempt(address recipient, uint256 amount) external returns (bool);
    function balance() external view returns (uint256);
}