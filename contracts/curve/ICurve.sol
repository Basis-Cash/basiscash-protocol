pragma solidity ^0.6.0;

interface ICurve {
    function minSupply() external view returns (uint256);

    function maxSupply() external view returns (uint256);

    function minCeiling() external view returns (uint256);

    function maxCeiling() external view returns (uint256);

    function calcCeiling(uint256 _supply) external view returns (uint256);
}
