pragma solidity ^0.6.0;

interface IOracle {
    function update() external;
    function consult(address token, uint amountIn) external view returns (uint amountOut);
    // function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestamp);
}