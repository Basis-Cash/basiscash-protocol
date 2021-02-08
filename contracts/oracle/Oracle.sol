// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {Babylonian} from '../lib/Babylonian.sol';
import {FixedPoint} from '../lib/FixedPoint.sol';
import {UniswapV2Library} from '../lib/UniswapV2Library.sol';
import {UniswapV2OracleLibrary} from '../lib/UniswapV2OracleLibrary.sol';
import {Epoch} from '../utils/Epoch.sol';
import {IUniswapV2Pair} from '../interfaces/IUniswapV2Pair.sol';
import {IUniswapV2Factory} from '../interfaces/IUniswapV2Factory.sol';

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract Oracle is Epoch {
    using FixedPoint for *;
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    // uniswap
    address public token0;
    address public token1;
    IUniswapV2Pair public pair;

    // oracle
    uint32 public blockTimestampLast;
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _factory,
        address _tokenA,
        address _tokenB,
        uint256 _period,
        uint256 _startTime
    ) Epoch(_period, _startTime, 0) {
        IUniswapV2Pair _pair =
            IUniswapV2Pair(
                UniswapV2Library.pairFor(_factory, _tokenA, _tokenB)
            );
        pair = _pair;
        token0 = _pair.token0();
        token1 = _pair.token1();
        price0CumulativeLast = _pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
        price1CumulativeLast = _pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, 'Oracle: NO_RESERVES'); // ensure that there's liquidity in the pair
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    /** @dev Updates 1-day EMA price from Uniswap.  */
    function update() external checkEpoch {
        (
            uint256 price0Cumulative,
            uint256 price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        if (timeElapsed == 0) {
            // prevent divided by zero
            return;
        }

        // overflow is desired, casting never truncates
        // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
        price0Average = FixedPoint.uq112x112(
            uint224((price0Cumulative - price0CumulativeLast) / timeElapsed)
        );
        price1Average = FixedPoint.uq112x112(
            uint224((price1Cumulative - price1CumulativeLast) / timeElapsed)
        );

        price0CumulativeLast = price0Cumulative;
        price1CumulativeLast = price1Cumulative;
        blockTimestampLast = blockTimestamp;

        emit Updated(price0Cumulative, price1Cumulative);
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address token, uint256 amountIn)
        external
        view
        returns (uint144 amountOut)
    {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, 'Oracle: INVALID_TOKEN');
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }

    // collaboration of update / consult
    function expectedPrice(address token, uint256 amountIn)
        external
        view
        returns (uint224 amountOut)
    {
        (
            uint256 price0Cumulative,
            uint256 price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        FixedPoint.uq112x112 memory avg0 =
            FixedPoint.uq112x112(
                uint224((price0Cumulative - price0CumulativeLast) / timeElapsed)
            );
        FixedPoint.uq112x112 memory avg1 =
            FixedPoint.uq112x112(
                uint224((price1Cumulative - price1CumulativeLast) / timeElapsed)
            );

        if (token == token0) {
            amountOut = avg0.mul(amountIn).decode144();
        } else {
            require(token == token1, 'Oracle: INVALID_TOKEN');
            amountOut = avg1.mul(amountIn).decode144();
        }
        return amountOut;
    }

    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) external pure returns (address lpt) {
        return UniswapV2Library.pairFor(factory, tokenA, tokenB);
    }

    event Updated(uint256 price0CumulativeLast, uint256 price1CumulativeLast);
}
