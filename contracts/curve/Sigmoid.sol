// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Math} from '@openzeppelin/contracts/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {Operator} from '../access/Operator.sol';
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
    ) {
        minSupply = _minSupply;
        maxSupply = _maxSupply;
        minCeiling = _minCeiling;
        maxCeiling = _maxCeiling;

        slots[0] = 1000000000000000000;
        slots[1] = 994907149075715143;
        slots[2] = 988513057369406817;
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
        slots[20] = 11486942630593183;
        slots[21] = 5092850924284857;
        slots[22] = 0;
    }

    /* ========== GOVERNANCE ========== */

    function setMinSupply(uint256 _newMinSupply) public override onlyOperator {
        super.setMinSupply(_newMinSupply);
    }

    function setMaxSupply(uint256 _newMaxSupply) public override onlyOperator {
        super.setMaxSupply(_newMaxSupply);
    }

    function setMinCeiling(uint256 _newMinCeiling)
        public
        override
        onlyOperator
    {
        super.setMinCeiling(_newMinCeiling);
    }

    function setMaxCeiling(uint256 _newMaxCeiling)
        public
        override
        onlyOperator
    {
        super.setMaxCeiling(_newMaxCeiling);
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
        uint256 xa = _supply.sub(minSupply).div(slotWidth);
        uint256 xb = Math.min(xa.add(1), slots.length.sub(1));

        uint256 slope = slots[xa].sub(slots[xb]).mul(1e18).div(slotWidth);
        uint256 wy = slots[xa].add(slope.mul(slotWidth.mul(xa)).div(1e18));

        uint256 percentage = 0;
        if (wy > slope.mul(_supply).div(1e18)) {
            percentage = wy.sub(slope.mul(_supply).div(1e18));
        } else {
            percentage = slope.mul(_supply).div(1e18).sub(wy);
        }

        return
            minCeiling.add(
                maxCeiling.sub(minCeiling).mul(percentage).div(1e18)
            );
    }
}
