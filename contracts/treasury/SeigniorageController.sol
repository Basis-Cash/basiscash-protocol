pragma solidity ^0.6.0;

import {Storage} from './Storage.sol';

abstract contract SeigniorageController is Storage {
    function allocateSeigniorage() external {}
}
