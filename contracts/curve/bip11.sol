// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Math} from '@openzeppelin/contracts/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {Operator} from '../access/Operator.sol';
import {Curve} from './Curve.sol';

contract BIP11 is Operator, Curve {
    using SafeMath for uint256;

    /* ============= STATE VARIABLES ============= */

    uint256[41] private slots;

    /* ============= CONSTRUCTOR ============= */

    constructor(
        uint256 _minSupply,
        uint256 _maxSupply,
        uint256 _minCeiling,
        uint256 _maxCeiling
    ) {
        minSupply = _minSupply; // minimum price == 0
        maxSupply = _maxSupply; // maximum price == 1
        minCeiling = _minCeiling; // minimum ceiling == 0
        maxCeiling = _maxCeiling; // maximum ceiling == 0

        slots[0] = 254991593906910240;
        slots[1] = 255656216913953120;
        slots[2] = 256409333446256384;
        slots[3] = 257262726279814880;
        slots[4] = 258229747049020032;
        slots[5] = 259325525137728320;
        slots[6] = 260567204383852672;
        slots[7] = 261974211300803616;
        slots[8] = 263568559012200928;
        slots[8] = 265375191655021440;
        slots[9] = 267422374639493536;
        slots[10] = 269742136871492800;
        slots[11] = 272370771856165600;
        slots[12] = 275349405522724960;
        slots[13] = 278724639654239424;
        slots[14] = 282549280989103488;
        slots[15] = 286883167401240032;
        slots[16] = 291794104084919936;
        slots[17] = 297358924391140992;
        slots[18] = 303664691912730176;
        slots[19] = 310810062625218048;
        slots[20] = 318906828394662656;
        slots[21] = 328081666001153216;
        slots[22] = 338478119042087424;
        slots[23] = 350258843722803840;
        slots[24] = 363608153670763840;
        slots[25] = 378734903587804416;
        slots[26] = 395875756856227584;
        slots[27] = 415298888221586752;
        slots[28] = 437308179481957312;
        slots[29] = 462247973826743424;
        slots[30] = 490508463208342656;
        slots[31] = 522531793034013184;
        slots[32] = 558818979688020544;
        slots[33] = 599937749111156096;
        slots[34] = 646531419074993792;
        slots[35] = 699328964117222656;
        slots[36] = 759156420607550464;
        slots[37] = 826949810380488320;
        slots[38] = 903769785129849216;
        slots[39] = 990818220681719680;
        slots[40] = 1015797020769208960;
    }

    /* ============= GOVERNANCE ============= */

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

    function calcCeiling(uint256 _price)
        public
        view
        override
        returns (uint256)
    {
        if (_price <= minSupply) {
            return minCeiling;
        }
        if (_price >= maxSupply) {
            return maxCeiling;
        }

        uint256 slotWidth = maxSupply.sub(minSupply).div(slots.length.sub(1));
        uint256 xa = _price.sub(minSupply).div(slotWidth);
        uint256 xb = xa.add(1);

        uint256 slope = slots[xb].sub(slots[xa]).mul(1e18).div(slotWidth);
        uint256 x = slope.mul(slotWidth.mul(xa)).div(1e18);
        uint256 y = slots[xa];

        uint256 wy = 0;
        uint256 percentage = 0;
        if (x > y) {
            wy = x.sub(y);
            percentage = slope.mul(_price).div(1e18).sub(wy);
        } else {
            wy = y.sub(x);
            percentage = slope.mul(_price).div(1e18);
        }

        return
            minCeiling.add(
                maxCeiling.sub(minCeiling).mul(percentage).div(1e18)
            );
    }
}
