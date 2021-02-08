// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {UniswapV2Library} from '../lib/UniswapV2Library.sol';

contract PairExpector {
    function expect(
        address _factory,
        address _tokenA,
        address _tokenB
    ) public pure returns (address) {
        return UniswapV2Library.pairFor(_factory, _tokenA, _tokenB);
    }
}
