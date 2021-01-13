pragma solidity ^0.6.0;

import {Operator} from '../owner/Operator.sol';

contract Storage is Operator {
    /* ========== EVENTS ========== */

    event Initialized(address indexed executor, uint256 at);
    event Migration(address indexed target);
    event ContributionPoolChanged(
        address indexed operator,
        address oldFund,
        address newFund
    );
    event ContributionPoolRateChanged(
        address indexed operator,
        uint256 oldRate,
        uint256 newRate
    );
    event BondOracleChanged(
        address indexed operator,
        address oldOracle,
        address newOracle
    );
    event SeigniorageOracleChanged(
        address indexed operator,
        address oldOracle,
        address newOracle
    );
    event CeilingCurveChanged(
        address indexed operator,
        address oldCurve,
        address newCurve
    );

    /* ========== STATE VARIABLES ========== */

    // ========== CORE
    address public bond;
    address public cash;
    address public share;

    address public fund;
    address public curve;
    address public boardroom;

    address public bOracle;
    address public sOracle;

    // ========== FLAGS
    bool public migrated = false;
    bool public initialized = false;

    // ========== PARAMS
    uint256 public cashPriceOne;

    uint256 public lastBondOracleEpoch = 0;
    uint256 public cashConversionLimit = 0;
    uint256 public accumulatedSeigniorage = 0;
    uint256 public accumulatedCashConversion = 0;
    uint256 public fundAllocationRate = 2; // %

    /* ========== GOVERNANCE ========== */

    // FUND
    function setFund(address newFund) public onlyOperator {
        address oldFund = fund;
        fund = newFund;
        emit ContributionPoolChanged(msg.sender, oldFund, newFund);
    }

    function setFundAllocationRate(uint256 newRate) public onlyOperator {
        uint256 oldRate = fundAllocationRate;
        fundAllocationRate = newRate;
        emit ContributionPoolRateChanged(msg.sender, oldRate, newRate);
    }

    // ORACLE
    function setBondOracle(address newOracle) public onlyOperator {
        address oldOracle = bOracle;
        bOracle = newOracle;
        emit BondOracleChanged(msg.sender, oldOracle, newOracle);
    }

    function setSeigniorageOracle(address newOracle) public onlyOperator {
        address oldOracle = sOracle;
        sOracle = newOracle;
        emit SeigniorageOracleChanged(msg.sender, oldOracle, newOracle);
    }

    // TWEAK
    function setCeilingCurve(address newCurve) public onlyOperator {
        address oldCurve = newCurve;
        curve = newCurve;
        emit CeilingCurveChanged(msg.sender, oldCurve, newCurve);
    }
}
