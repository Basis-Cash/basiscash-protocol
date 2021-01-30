pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/Math.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IOracle.sol';
import './interfaces/IBoardroom.sol';
import './interfaces/IBasisAsset.sol';
import './interfaces/ISimpleERCFund.sol';
import './lib/Babylonian.sol';
import './lib/FixedPoint.sol';
import './lib/Safe112.sol';
import './owner/Operator.sol';
import './utils/Epoch.sol';
import './utils/ContractGuard.sol';

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
    bool public initializedV2 = false;

    // ========== CORE
    address public fund;
    address public cash;
    address public bond;
    address public share;
    address public boardroom;

    address public bondOracle;
    address public seigniorageOracle;

    // ========== V2
    uint256 public start_migration_v2;
    uint256 public stop_migration_v2;
    address public cashV2;
    address public shareV2;
    mapping(address => mapping(uint256 => uint256)) public claimableBondsBucket; // claimableBondsBucket[wallet][epoch] = amount
    uint256 MINIMUM_EPOCH = 38;

    // ========== PARAMS
    uint256 public cashPriceOne;
    uint256 public cashPriceCeiling;
    uint256 public bondDepletionFloor;
    uint256 private accumulatedSeigniorage = 0;
    uint256 public fundAllocationRate = 1; // %

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash,
        address _bond,
        address _share,
        address _bondOracle,
        address _seigniorageOracle,
        address _boardroom,
        address _fund,
        uint256 _startTime
    ) public Epoch(6 hours, _startTime, 0) {
        cash = _cash;
        bond = _bond;
        share = _share;
        bondOracle = _bondOracle;
        seigniorageOracle = _seigniorageOracle;

        boardroom = _boardroom;
        fund = _fund;

        cashPriceOne = 10**18;
        cashPriceCeiling = uint256(101).mul(cashPriceOne).div(10**2);

        bondDepletionFloor = uint256(1000).mul(cashPriceOne);
    }

    /* =================== Modifier =================== */
    modifier checkInitializedV2 {
         require(initializedV2, 'Treasury has not initialized V2 yet!');

         _;
    }

    modifier checkMigrationWindowV2 {
        require(start_migration_v2>= block.timestamp && stop_migration_v2 <= block.timestamp, 'Treasury: currently not inside of V2 migration window!');

        _;
    }

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

    modifier checkOperatorV2 {
        require(
            IBasisAsset(cashV2).operator() == address(this) &&
                IBasisAsset(shareV2).operator() == address(this),
            'Treasury: need more permission'
        );

        _;
    }

    /* ========== VIEW FUNCTIONS ========== */

    // budget
    function getReserve() public view returns (uint256) {
        return accumulatedSeigniorage;
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
            return price.mul(1e12); // for USDT decimal
        } catch {
            revert('Treasury: failed to consult cash price from the oracle');
        }
    }

    /* ========== GOVERNANCE ========== */

    function initialize() public checkOperator {
        require(!initialized, 'Treasury: initialized');

        // set accumulatedSeigniorage to it's balance
        accumulatedSeigniorage = IERC20(cash).balanceOf(address(this));

        initialized = true;
        emit Initialized(msg.sender, block.number);
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

    function setupV2(address _cashv2, address _sharev2, uint256 _start_migration_v2, uint256 _stop_migration_v2) public onlyOperator {
         require(!initializedV2, 'Treasury did already setup V2!');
         // v2 migration window
         start_migration_v2 = _start_migration_v2;
         stop_migration_v2 = _stop_migration_v2;

         // cash v2
         cashV2 = _cashv2;
         Operator(cashV2).transferOperator(address(this));
         Operator(cashV2).transferOwnership(address(this));

         // share v2
         shareV2 = _sharev2;
         Operator(shareV2).transferOperator(address(this));
         Operator(shareV2).transferOwnership(address(this));
    }

    function setFund(address newFund) public onlyOperator {
        fund = newFund;
        emit ContributionPoolChanged(msg.sender, newFund);
    }

    function setFundAllocationRate(uint256 rate) public onlyOperator {
        fundAllocationRate = rate;
        emit ContributionPoolRateChanged(msg.sender, rate);
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    function _updateCashPrice() internal {
        try IOracle(bondOracle).update()  {} catch {}
        try IOracle(seigniorageOracle).update()  {} catch {}
    }

    function buyBonds(uint256 amount, uint256 targetPrice)
        external
    {
        require(false, 'Treasury: can no longer purchase bonds');
    }

    function redeemBonds(uint256 amount, uint256 targetPrice)
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
    {
        require(amount > 0, 'Treasury: cannot redeem bonds with zero amount');

        uint256 cashPrice = _getCashPrice(bondOracle);
        require(cashPrice == targetPrice, 'Treasury: cash price moved');
        require(
            cashPrice > cashPriceCeiling, // price > $1.01
            'Treasury: cashPrice not eligible for bond purchase'
        );
        require(
            IERC20(cash).balanceOf(address(this)) >= amount,
            'Treasury: treasury has no more budget'
        );

        accumulatedSeigniorage = accumulatedSeigniorage.sub(
            Math.min(accumulatedSeigniorage, amount)
        );

        IBasisAsset(bond).burnFrom(msg.sender, amount);
        IERC20(cash).safeTransfer(msg.sender, amount);
        _updateCashPrice();

        emit RedeemedBonds(msg.sender, amount);
    }

    function calculateClaimableBondsForEpoch(address wallet, uint256 epoch) view public returns (uint256) {
        uint256 epoch_delta = getCurrentEpoch() - epoch;
        uint256 tax_percentage = (epoch_delta > 4) ? 0: 10*(5 - epoch_delta);
        return claimableBondsBucket[wallet][epoch].mul(100 - tax_percentage).div(100);
    }

    function claimBondsForEpoch(uint256 epoch) public
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
        checkOperatorV2
        checkInitializedV2
        checkMigrationWindowV2
    {
        uint256 amount = calculateClaimableBondsForEpoch(msg.sender, epoch);
        claimableBondsBucket[msg.sender][epoch]=0;
        require(
            IERC20(cashV2).balanceOf(address(this)) >= amount,
            'Treasury: treasury currently does not hold the amount of MICv2 needed to exchange for given bonds'
        );
        IERC20(cashV2).safeTransfer(msg.sender, amount);
    }

    function calculateClaimableBonds(address wallet) view public returns (uint256) {
        uint256 claimableBonds = 0;
        uint256 epoch = getCurrentEpoch();
        while (epoch > MINIMUM_EPOCH) {
            claimableBonds = claimableBonds.add(calculateClaimableBondsForEpoch(wallet, epoch));
            epoch = epoch.sub(1);
        }
        return claimableBonds;
    }

    function claimBonds() public
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
        checkOperatorV2
        checkInitializedV2
        checkMigrationWindowV2
    {
        uint256 amount = 0;
        uint256 epoch = getCurrentEpoch();
        while (epoch > MINIMUM_EPOCH) {
            amount = amount.add(calculateClaimableBondsForEpoch(msg.sender, epoch));
            claimableBondsBucket[msg.sender][epoch]=0;
            epoch = epoch.sub(1);
        }
        require(
            IERC20(cashV2).balanceOf(address(this)) >= amount,
            'Treasury: treasury currently does not hold the amount of MICv2 needed to exchange for given bonds'
        );
        IERC20(cashV2).safeTransfer(msg.sender, amount);
    }

    function addClaimableBonds(uint256 amount) internal {
        uint256 current_epoch = getCurrentEpoch();
        claimableBondsBucket[msg.sender][current_epoch] = claimableBondsBucket[msg.sender][current_epoch].add(amount);
    }

    function exchangeBonds(uint256 amount)
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
        checkOperatorV2
        checkInitializedV2
        checkMigrationWindowV2
    {
        require(amount > 0, 'Treasury: cannot exchange bonds with zero amount');
        require(
            IERC20(bond).balanceOf(msg.sender) >= amount,
            'Treasury: sender does not have enough bonds to exchange amount'
        );

        IBasisAsset(bond).burnFrom(msg.sender, amount);

        addClaimableBonds(amount);
        _updateCashPrice();

        emit ExchangedBonds(msg.sender, amount);
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
        if (cashPrice <= cashPriceCeiling) {
            return; // just advance epoch instead revert
        }

        // circulating supply
        uint256 cashSupply = IERC20(cash).totalSupply().sub(
            accumulatedSeigniorage
        );
        uint256 percentage = cashPrice.sub(cashPriceOne);
        uint256 seigniorage = cashSupply.mul(percentage).div(1e18);
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
            emit ContributionPoolFunded(now, fundReserve);
        }

        seigniorage = seigniorage.sub(fundReserve);

        // ======================== BIP-4
        uint256 treasuryReserve = Math.min(
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
            emit TreasuryFunded(now, treasuryReserve);
        }

        // boardroom
        uint256 boardroomReserve = seigniorage.sub(treasuryReserve);
        if (boardroomReserve > 0) {
            IERC20(cash).safeApprove(boardroom, boardroomReserve);
            IBoardroom(boardroom).allocateSeigniorage(boardroomReserve);
            emit BoardroomFunded(now, boardroomReserve);
        }
    }

    // GOV
    event Initialized(address indexed executor, uint256 at);
    event Migration(address indexed target);
    event ContributionPoolChanged(address indexed operator, address newFund);
    event ContributionPoolRateChanged(
        address indexed operator,
        uint256 newRate
    );

    // CORE
    event ExchangedBonds(address indexed from, uint256 amount);
    event RedeemedBonds(address indexed from, uint256 amount);
    event BoughtBonds(address indexed from, uint256 amount);
    event TreasuryFunded(uint256 timestamp, uint256 seigniorage);
    event BoardroomFunded(uint256 timestamp, uint256 seigniorage);
    event ContributionPoolFunded(uint256 timestamp, uint256 seigniorage);
}