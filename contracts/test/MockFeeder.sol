// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {IFeeder} from '../migration/Feeder.sol';

contract MockFeeder is IFeeder {
    function feed() external override {
        emit Feeded(msg.sender, 0, 0);
    }
}
