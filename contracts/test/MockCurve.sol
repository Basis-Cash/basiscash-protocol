// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Curve} from '../curve/Curve.sol';

contract MockCurve is Curve {
    uint256 public ceiling;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        uint256 _ceiling,
        uint256 _minSupply,
        uint256 _maxSupply,
        uint256 _minCeiling,
        uint256 _maxCeiling
    ) {
        ceiling = _ceiling;
        minSupply = _minSupply;
        maxSupply = _maxSupply;
        minCeiling = _minCeiling;
        maxCeiling = _maxCeiling;
    }

    function setCeiling(uint256 _ceiling) public {
        ceiling = _ceiling;
    }

    function calcCeiling(uint256) external view override returns (uint256) {
        return ceiling;
    }
}
