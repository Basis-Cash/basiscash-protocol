// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import '../utils/Epoch.sol';

contract EpochTester is Epoch {
    constructor(
        uint256 _period,
        uint256 _startTime,
        uint256 _startEpoch
    ) Epoch(_period, _startTime, _startEpoch) {}

    function testCheckStartTime() public checkStartTime {}

    function testCheckEpoch() public checkEpoch {}
}
