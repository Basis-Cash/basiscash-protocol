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
import {IOracle} from '../oracle/Oracle.sol';
import {IBasisAsset} from '../assets/IBasisAsset.sol';
import {ISimpleERCFund} from '../cdf/ISimpleERCFund.sol';
import {Babylonian} from '../lib/Babylonian.sol';
import {Operator} from '../access/Operator.sol';
import {Epoch} from '../utils/Epoch.sol';
import {SeigniorageProxy} from './SeigniorageProxy.sol';
import {ContractGuard} from '../utils/ContractGuard.sol';
import {TreasuryState} from './TreasuryState.sol';

/**
 * @title Basis Cash Treasury contract
 * @notice Monetary policy logic to adjust supplies of basis cash assets
 * @author Summer Smith & Rick Sanchez
 */
contract Treasury is TreasuryState, ContractGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Address for address;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash,
        address _bond,
        address _share,
        address _bOracle,
        address _sOracle,
        address _seigniorageProxy,
        address _fund,
        address _curve,
        uint256 _startTime
    ) Epoch(1 days, _startTime, 0) {
        cash = _cash;
        bond = _bond;
        share = _share;
        curve = _curve;

        bOracle = _bOracle;
        sOracle = _sOracle;
        seigniorageProxy = _seigniorageProxy;

        fund = _fund;

        cashPriceOne = 10**18;
    }

    /* =================== Modifier =================== */

    modifier checkMigration {
        require(!migrated, 'Treasury: migrated');

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
        return _getCashPrice(bOracle);
    }

    function getSeigniorageOraclePrice() public view returns (uint256) {
        return _getCashPrice(sOracle);
    }

    function _getCashPrice(address oracle) internal view returns (uint256) {
        try IOracle(oracle).consult(cash, 1e18) returns (uint256 price) {
            return price;
        } catch {
            revert('Treasury: failed to consult cash price from the oracle');
        }
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    function _updateConversionLimit(uint256 cashPrice) internal {
        uint256 currentEpoch = Epoch(bOracle).getLastEpoch(); // lastest update time
        if (lastBondOracleEpoch != currentEpoch) {
            uint256 percentage = cashPriceOne.sub(cashPrice);
            uint256 bondSupply = IERC20(bond).totalSupply();

            bondCap = circulatingSupply().mul(percentage).div(1e18);
            bondCap = bondCap.sub(Math.min(bondCap, bondSupply));

            lastBondOracleEpoch = currentEpoch;
        }
    }

    function _updateCashPrice() internal {
        if (Epoch(bOracle).callable()) {
            try IOracle(bOracle).update() {} catch {}
        }
        if (Epoch(sOracle).callable()) {
            try IOracle(sOracle).update() {} catch {}
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

        uint256 cashPrice = _getCashPrice(bOracle);
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

        uint256 cashPrice = _getCashPrice(bOracle);
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
        uint256 cashPrice = _getCashPrice(sOracle);
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
            IERC20(cash).safeIncreaseAllowance(fund, fundReserve);
            ISimpleERCFund(fund).deposit(
                cash,
                fundReserve,
                'Treasury: Seigniorage Allocation'
            );
            emit FundedToCommunityFund(block.timestamp, fundReserve);
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

        // seigniorage
        seigniorage = seigniorage.sub(treasuryReserve);
        if (seigniorage > 0) {
            IERC20(cash).safeIncreaseAllowance(seigniorageProxy, seigniorage);
            SeigniorageProxy(seigniorageProxy).allocateSeigniorage(seigniorage);
            emit SeigniorageDistributed(block.timestamp, seigniorage);
        }
    }

    // CORE
    event RedeemedBonds(address indexed from, uint256 amount);
    event BoughtBonds(address indexed from, uint256 amount);
    event TreasuryFunded(uint256 timestamp, uint256 seigniorage);
    event SeigniorageDistributed(uint256 timestamp, uint256 seigniorage);
    event FundedToCommunityFund(uint256 timestamp, uint256 seigniorage);
}
