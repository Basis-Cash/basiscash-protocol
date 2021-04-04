// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import {Operator} from '../access/Operator.sol';
import {Epoch} from '../utils/Epoch.sol';
import {IBasisAsset} from '../assets/IBasisAsset.sol';

abstract contract TreasuryState is Epoch {
    /* ========== EVENTS ========== */
    event Initialized(address indexed executor, uint256 at);
    event Migration(address indexed target);

    /* ========== STATE VARIABLES ========== */

    // ========== FLAGS
    bool public migrated = false;
    bool public initialized = false;

    // ========== CORE
    address public cash; // immutable
    address public bond; // immutable
    address public share; // immutable

    address public fund;
    address public curve;

    address public bOracle;
    address public sOracle;
    address public seigniorageProxy;

    // ========== PARAMS
    uint256 public cashPriceOne;

    uint256 public lastBondOracleEpoch = 0;
    uint256 public bondCap = 0;
    uint256 public accumulatedSeigniorage = 0;
    uint256 public fundAllocationRate = 2; // %

    modifier checkOperator {
        require(
            IBasisAsset(cash).operator() == address(this) &&
                IBasisAsset(bond).operator() == address(this) &&
                IBasisAsset(share).operator() == address(this),
            'Treasury: need more permission'
        );

        _;
    }

    /* ========== GOVERNANCE ========== */

    // MIGRATION
    function initialize() public checkOperator {
        require(!initialized, 'Treasury: initialized');

        // set accumulatedSeigniorage to it's balance
        accumulatedSeigniorage = IERC20(cash).balanceOf(address(this));

        initialized = true;
        emit Initialized(_msgSender(), block.number);
    }

    function migrate(address target) public onlyOperator checkOperator {
        require(!migrated, 'Treasury: migrated');

        // cash
        Operator(cash).transferOperator(target);
        Operator(cash).transferOwnership(target);
        IERC20(cash).transfer(target, IERC20(cash).balanceOf(address(this)));

        // bond
        Operator(bond).transferOperator(target);
        Operator(bond).transferOwnership(target);
        IERC20(bond).transfer(target, IERC20(bond).balanceOf(address(this)));

        // share
        Operator(share).transferOperator(target);
        Operator(share).transferOwnership(target);
        IERC20(share).transfer(target, IERC20(share).balanceOf(address(this)));

        migrated = true;
        emit Migration(target);
    }

    // GOV
    function setFund(address _newFund) public onlyOperator {
        fund = _newFund;
    }

    function setCeilingCurve(address _newCurve) public onlyOperator {
        curve = _newCurve;
    }

    function setBondOracle(address _newOracle) public onlyOperator {
        bOracle = _newOracle;
    }

    function setSeigniorageOracle(address _newOracle) public onlyOperator {
        sOracle = _newOracle;
    }

    function setSeigniorageProxy(address _newProxy) public onlyOperator {
        seigniorageProxy = _newProxy;
    }

    function setFundAllocationRate(uint256 _newRate) public onlyOperator {
        fundAllocationRate = _newRate;
    }
}
