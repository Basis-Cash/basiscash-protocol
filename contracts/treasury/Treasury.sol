// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import {Math} from '@openzeppelin/contracts/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {
    ReentrancyGuard
} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import {ICurve} from '../curve/Curve.sol';
import {IOracle} from '../oracle/IOracle.sol';
import {IBoardroomV2} from '../boardroom/v2/Boardroom.sol';
import {IBasisAsset} from '../assets/IBasisAsset.sol';
import {ISimpleERCFund} from '../cdf/ISimpleERCFund.sol';
import {Babylonian} from '../lib/Babylonian.sol';
import {FixedPoint} from '../lib/FixedPoint.sol';
import {Safe112} from '../lib/Safe112.sol';
import {Operator} from '../access/Operator.sol';
import {Epoch} from '../utils/Epoch.sol';
import {ContractGuard} from '../utils/ContractGuard.sol';

/**
 * @title Basis Cash Treasury contract
 * @notice Monetary policy logic to adjust supplies of basis cash assets
 * @author Summer Smith & Rick Sanchez
 */
contract Treasury is ContractGuard, Epoch {
    using FixedPoint for *;
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    /* ========== STATE VARIABLES ========== */

    // ========== FLAGS
    bool public migrated = false;
    bool public initialized = false;

    // ========== CORE
    address public fund;
    address public cash;
    address public bond;
    address public share;
    address public curve;
    address public boardroom;

    address public bondOracle;
    address public seigniorageOracle;

    // ========== PARAMS
    uint256 public cashPriceOne;

    uint256 public lastBondOracleEpoch = 0;
    uint256 public bondCap = 0;
    uint256 public accumulatedSeigniorage = 0;
    uint256 public fundAllocationRate = 2; // %

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash,
        address _bond,
        address _share,
        address _bondOracle,
        address _seigniorageOracle,
        address _boardroom,
        address _fund,
        address _curve,
        uint256 _startTime
    ) Epoch(1 days, _startTime, 0) {
        cash = _cash;
        bond = _bond;
        share = _share;
        curve = _curve;
        bondOracle = _bondOracle;
        seigniorageOracle = _seigniorageOracle;

        boardroom = _boardroom;
        fund = _fund;

        cashPriceOne = 10**18;
    }

    /* =================== Modifier =================== */

    modifier checkMigration {
        require(!migrated, 'Treasury: migrated');

        _;
    }

    modifier checkOperator {
        require(
            IBasisAsset(cash).operator() == address(this) &&
                IBasisAsset(bond).operator() == address(this) &&
                IBasisAsset(share).operator() == address(this) &&
                Operator(boardroom).operator() == address(this),
            'Treasury: need more permission'
        );

        _;
    }

    modifier updatePrice {
        _;

        _updateCashPrice();
    }

    /* ========== VIEW FUNCTIONS ========== */

    // budget
    function getReserve() public view returns (uint256) {
        return accumulatedSeigniorage;
    }

    function circulatingSupply() public view returns (uint256) {
        return IERC20(cash).totalSupply().sub(accumulatedSeigniorage);
    }

    function getCeilingPrice() public view returns (uint256) {
        return ICurve(curve).calcCeiling(circulatingSupply());
    }

    // oracle
    function getBondOraclePrice() public view returns (uint256) {
        return _getCashPrice(bondOracle);
    }

    function getSeigniorageOraclePrice() public view returns (uint256) {
        return _getCashPrice(seigniorageOracle);
    }

    function _getCashPrice(address oracle) internal view returns (uint256) {
        try IOracle(oracle).consult(cash, 1e18) returns (uint256 price) {
            return price;
        } catch {
            revert('Treasury: failed to consult cash price from the oracle');
        }
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

    // FUND
    function setFund(address newFund) public onlyOperator {
        address oldFund = fund;
        fund = newFund;
        emit ContributionPoolChanged(_msgSender(), oldFund, newFund);
    }

    function setFundAllocationRate(uint256 newRate) public onlyOperator {
        uint256 oldRate = fundAllocationRate;
        fundAllocationRate = newRate;
        emit ContributionPoolRateChanged(_msgSender(), oldRate, newRate);
    }

    // ORACLE
    function setBondOracle(address newOracle) public onlyOperator {
        address oldOracle = bondOracle;
        bondOracle = newOracle;
        emit BondOracleChanged(_msgSender(), oldOracle, newOracle);
    }

    function setSeigniorageOracle(address newOracle) public onlyOperator {
        address oldOracle = seigniorageOracle;
        seigniorageOracle = newOracle;
        emit SeigniorageOracleChanged(_msgSender(), oldOracle, newOracle);
    }

    // TWEAK
    function setCeilingCurve(address newCurve) public onlyOperator {
        address oldCurve = newCurve;
        curve = newCurve;
        emit CeilingCurveChanged(_msgSender(), oldCurve, newCurve);
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    function _updateConversionLimit(uint256 cashPrice) internal {
        uint256 currentEpoch = Epoch(bondOracle).getLastEpoch(); // lastest update time
        if (lastBondOracleEpoch != currentEpoch) {
            uint256 percentage = cashPriceOne.sub(cashPrice);
            uint256 bondSupply = IERC20(bond).totalSupply();

            bondCap = circulatingSupply().mul(percentage).div(1e18);
            bondCap = bondCap.sub(Math.min(bondCap, bondSupply));

            lastBondOracleEpoch = currentEpoch;
        }
    }

    function _updateCashPrice() internal {
        if (Epoch(bondOracle).callable()) {
            try IOracle(bondOracle).update() {} catch {}
        }
        if (Epoch(seigniorageOracle).callable()) {
            try IOracle(seigniorageOracle).update() {} catch {}
        }
    }

    function buyBonds(uint256 amount, uint256 targetPrice)
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
        updatePrice
    {
        require(amount > 0, 'Treasury: cannot purchase bonds with zero amount');

        uint256 cashPrice = _getCashPrice(bondOracle);
        require(cashPrice <= targetPrice, 'Treasury: cash price moved');
        require(
            cashPrice < cashPriceOne, // price < $1
            'Treasury: cashPrice not eligible for bond purchase'
        );
        _updateConversionLimit(cashPrice);

        amount = Math.min(amount, bondCap.mul(cashPrice).div(1e18));
        require(amount > 0, 'Treasury: amount exceeds bond cap');

        IBasisAsset(cash).burnFrom(_msgSender(), amount);
        IBasisAsset(bond).mint(_msgSender(), amount.mul(1e18).div(cashPrice));

        emit BoughtBonds(_msgSender(), amount);
    }

    function redeemBonds(uint256 amount)
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
        updatePrice
    {
        require(amount > 0, 'Treasury: cannot redeem bonds with zero amount');

        uint256 cashPrice = _getCashPrice(bondOracle);
        require(
            cashPrice > getCeilingPrice(), // price > $1.05
            'Treasury: cashPrice not eligible for bond purchase'
        );
        require(
            IERC20(cash).balanceOf(address(this)) >= amount,
            'Treasury: treasury has no more budget'
        );

        accumulatedSeigniorage = accumulatedSeigniorage.sub(
            Math.min(accumulatedSeigniorage, amount)
        );

        IBasisAsset(bond).burnFrom(_msgSender(), amount);
        IERC20(cash).safeTransfer(_msgSender(), amount);

        emit RedeemedBonds(_msgSender(), amount);
    }

    function allocateSeigniorage()
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkEpoch
        checkOperator
    {
        _updateCashPrice();
        uint256 cashPrice = _getCashPrice(seigniorageOracle);
        if (cashPrice <= getCeilingPrice()) {
            return; // just advance epoch instead revert
        }

        // circulating supply
        uint256 percentage = cashPrice.sub(cashPriceOne);
        uint256 seigniorage = circulatingSupply().mul(percentage).div(1e18);
        IBasisAsset(cash).mint(address(this), seigniorage);

        // ======================== BIP-3
        uint256 fundReserve = seigniorage.mul(fundAllocationRate).div(100);
        if (fundReserve > 0) {
            IERC20(cash).safeApprove(fund, fundReserve);
            ISimpleERCFund(fund).deposit(
                cash,
                fundReserve,
                'Treasury: Seigniorage Allocation'
            );
            emit ContributionPoolFunded(block.timestamp, fundReserve);
        }

        seigniorage = seigniorage.sub(fundReserve);

        // ======================== BIP-4
        uint256 treasuryReserve =
            Math.min(
                seigniorage,
                IERC20(bond).totalSupply().sub(accumulatedSeigniorage)
            );
        if (treasuryReserve > 0) {
            if (treasuryReserve == seigniorage) {
                treasuryReserve = treasuryReserve.mul(80).div(100);
            }
            accumulatedSeigniorage = accumulatedSeigniorage.add(
                treasuryReserve
            );
            emit TreasuryFunded(block.timestamp, treasuryReserve);
        }

        // boardroom
        uint256 boardroomReserve = seigniorage.sub(treasuryReserve);
        if (boardroomReserve > 0) {
            IERC20(cash).safeApprove(boardroom, boardroomReserve);
            // IBoardroomV2(boardroom).allocateSeigniorage(boardroomReserve);
            emit BoardroomFunded(block.timestamp, boardroomReserve);
        }
    }

    /* ========== EVENTS ========== */

    // GOV
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

    // CORE
    event RedeemedBonds(address indexed from, uint256 amount);
    event BoughtBonds(address indexed from, uint256 amount);
    event TreasuryFunded(uint256 timestamp, uint256 seigniorage);
    event BoardroomFunded(uint256 timestamp, uint256 seigniorage);
    event ContributionPoolFunded(uint256 timestamp, uint256 seigniorage);
}
