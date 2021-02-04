pragma solidity ^0.6.0;

interface IBoardroom {
    function allocateSeigniorage(uint256 amount) external;
    function setLockUp(
        uint256 _withdrawLockupEpochs,
        uint256 _rewardLockupEpochs,
        uint256 _epochAlignTimestamp,
        uint256 _epochPeriod
    ) external;
}
