pragma solidity ^0.6.0;

import '../utils/Epoch.sol';

contract EpochTester is Epoch {
    constructor(
        uint256 _period,
        uint256 _startTime,
        uint256 _startEpoch
    ) public Epoch(_period, _startTime, _startEpoch) {}

    function testCheckStartTime() public checkStartTime {}

    function testCheckEpoch() public checkEpoch {}
}
