pragma solidity ^0.6.0;

interface IBoardroomv2 {
    function allocateSeigniorage(uint256 amount) external;
    function addClaimableTaxes(uint256 amount) external;
}
