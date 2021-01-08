pragma solidity ^0.6.0;

import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {Operator} from '../owner/Operator.sol';
import {Curve} from './Curve.sol';

contract SigmoidThreshold is Operator, Curve {
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    uint256[23] private slots;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        uint256 _minSupply,
        uint256 _maxSupply,
        uint256 _minCeiling,
        uint256 _maxCeiling
    ) public {
        minSupply = _minSupply;
        maxSupply = _maxSupply;
        minCeiling = _minCeiling;
        maxCeiling = _maxCeiling;

        slots[0] = 1000000000000000000;
        slots[1] = 993307149075715268;
        slots[2] = 989013057369406812;
        slots[3] = 982013790037908452;
        slots[4] = 970687769248643639;
        slots[5] = 952574126822433143;
        slots[6] = 924141819978756551;
        slots[7] = 880797077977882314;
        slots[8] = 817574476193643651;
        slots[9] = 731058578630004896;
        slots[10] = 622459331201854593;
        slots[11] = 500000000000000000;
        slots[12] = 377540668798145407;
        slots[13] = 268941421369995104;
        slots[14] = 182425523806356349;
        slots[15] = 119202922022117574;
        slots[16] = 75858180021243560;
        slots[17] = 47425873177566788;
        slots[18] = 29312230751356326;
        slots[19] = 17986209962091562;
        slots[20] = 10986942630593183;
        slots[21] = 6692850924284857;
        slots[22] = 0;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function calcCeiling(uint256 _supply)
        public
        view
        override
        returns (uint256)
    {
        if (_supply <= minSupply) {
            return maxCeiling;
        }
        if (_supply >= maxSupply) {
            return minCeiling;
        }

        uint256 slotWidth = maxSupply.sub(minSupply).div(slots.length);
        uint256 pointA = _supply.sub(minSupply).div(slotWidth);
        uint256 pointB = pointA.add(1);

        uint256 slope =
            slotWidth.mul(1e18).div(slots[pointA].sub(slots[pointB]));
        uint256 ceiling = maxCeiling.sub(slope.mul(_supply));

        return ceiling;
    }
}
