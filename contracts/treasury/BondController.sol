pragma solidity ^0.6.0;

import {Storage} from './Storage.sol';

abstract contract BondController is Storage {
    function buyBonds(uint256 amount, uint256 targetPrice) external virtual {}

    function redeemBonds(uint256 amount) external virtual {}
}
