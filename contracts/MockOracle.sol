pragma solidity ^0.5.0;

import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Factory.sol';
import './lib/Babylonian.sol';
import './lib/FixedPoint.sol';
import './lib/SafeMath.sol';
import './lib/UniswapV2Library.sol';
import './lib/UniswapV2OracleLibrary.sol';

contract MockOracle {

    constructor() public {
    }

    function update() external {
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address /* token */, uint /* amountIn */) external view returns (uint amountOut) {
        amountOut = 1e18;
    }
}

