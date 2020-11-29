pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './lib/Babylonian.sol';
import './lib/FixedPoint.sol';
import './lib/Safe112.sol';
import './owner/Operator.sol';
import './utils/ContractGuard.sol';
import './interfaces/IBasisAsset.sol';
import './interfaces/IOracle.sol';
import './interfaces/IBoardroom.sol';

/**
 * @title Basis Cash Treasury contract
 * @notice Monetary policy logic to adjust supplies of basis cash assets
 * @author Summer Smith & Rick Sanchez
 */
contract Treasury is ContractGuard, Operator {
    using FixedPoint for *;
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    /* ========= CONSTANT VARIABLES ======== */

    uint256 public constant allocationDelay = 1 days;

    /* ========== STATE VARIABLES ========== */

    address private cash;
    address private bond;
    address private share;
    address private boardroom;
    IOracle private cashOracle;

    bool private migrated = false;
    uint256 private seigniorageSaved = 0;
    uint256 public startTime;
    uint256 public cashPriceCeiling;
    uint256 public cashPriceOne;
    uint256 private bondDepletionFloor;
    uint256 private lastAllocated;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash,
        address _bond,
        address _share,
        address _cashOracle,
        address _boardroom,
        uint256 _startTime
    ) public {
        cash = _cash;
        bond = _bond;
        share = _share;
        cashOracle = IOracle(_cashOracle);
        boardroom = _boardroom;

        startTime = _startTime;

        cashPriceOne = 10**18;
        cashPriceCeiling = uint256(105).mul(cashPriceOne).div(10**2);

        bondDepletionFloor = uint256(1000).mul(cashPriceOne);
        lastAllocated = now;
    }

    /* ========== MODIFIER ========== */

    modifier checkMigration {
        require(!migrated, 'Treasury: this contract has been migrated');
        _;
    }

    modifier checkOperator {
        require(
            IBasisAsset(cash).operator() == address(this),
            'Treasury: this contract is not the operator of the basis cash contract'
        );
        require(
            IBasisAsset(bond).operator() == address(this),
            'Treasury: this contract is not the operator of the basis bond contract'
        );
        require(
            Operator(boardroom).operator() == address(this),
            'Treasury: this contract is not the operator of the boardroom contract'
        );
        _;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function getCashPrice() public view returns (uint256 cashPrice) {
        try cashOracle.consult(cash, 1e18) returns (uint256 price) {
            return price;
        } catch {
            revert('Treasury: failed to consult cash price from the oracle');
        }
    }

    /* ========== GOVERNANCE ========== */

    function migrate(address target) public onlyOperator checkMigration {
        require(block.timestamp >= startTime, 'Treasury: not started yet');

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

    /* ========== MUTABLE FUNCTIONS ========== */

    function _getCashPrice() internal returns (uint256 cashPrice) {
        cashPrice = getCashPrice();
        try cashOracle.update()  {} catch {
            revert('Treasury: failed to update cash oracle');
        }
    }

    function _allocateSeigniorage(uint256 cashPrice)
        internal
        onlyOneBlock
        checkOperator
        checkMigration
        returns (bool, string memory)
    {
        if (now.sub(lastAllocated) < allocationDelay) {
            return (false, 'Treasury: a day has not passed yet');
        }
        if (block.timestamp < startTime) {
            return (false, 'Treasury: not started yet');
        }
        if (cashPrice <= cashPriceCeiling) {
            return (false, 'Treasury: there is no seigniorage to be allocated');
        }

        uint256 cashSupply = IERC20(cash).totalSupply();
        uint256 percentage = cashPrice.sub(cashPriceOne);
        uint256 seigniorage = cashSupply.mul(percentage).div(1e18);

        if (seigniorageSaved > bondDepletionFloor) {
            IBasisAsset(cash).mint(address(this), seigniorage);
            IERC20(cash).safeApprove(boardroom, seigniorage);
            IBoardroom(boardroom).allocateSeigniorage(seigniorage);
            emit BoardroomFunded(now, seigniorage);
        } else {
            seigniorageSaved = seigniorageSaved.add(seigniorage);
            IBasisAsset(cash).mint(address(this), seigniorage);
            emit TreasuryFunded(now, seigniorage);
        }

        lastAllocated = now;
        return (true, 'Treasury: success');
    }

    function buyBonds(uint256 amount, uint256 targetPrice) external {
        require(amount > 0, 'Treasury: cannot purchase bonds with zero amount');

        uint256 cashPrice = _getCashPrice();
        require(cashPrice == targetPrice, 'Treasury: cash price moved');
        _allocateSeigniorage(cashPrice); // ignore returns

        uint256 bondPrice = cashPrice;

        IBasisAsset(cash).burnFrom(msg.sender, amount);
        IBasisAsset(bond).mint(msg.sender, amount.mul(1e18).div(bondPrice));

        emit BoughtBonds(msg.sender, amount);
    }

    function redeemBonds(uint256 amount, uint256 targetPrice) external {
        require(amount > 0, 'Treasury: cannot redeem bonds with zero amount');

        uint256 cashPrice = _getCashPrice();
        require(cashPrice == targetPrice, 'Treasury: cash price moved');
        _allocateSeigniorage(cashPrice); // ignore returns

        require(
            cashPrice > cashPriceCeiling,
            'Treasury: bond redemption failed; basis cash remains depegged.'
        );

        uint256 treasuryBalance = IERC20(cash).balanceOf(address(this));
        require(
            treasuryBalance >= amount,
            'Treasury: treasury has no more budget'
        );

        if (seigniorageSaved >= amount) {
            seigniorageSaved = seigniorageSaved.sub(amount);
        } else {
            seigniorageSaved = 0;
        }

        IBasisAsset(bond).burnFrom(msg.sender, amount);
        IERC20(cash).safeTransfer(msg.sender, amount);

        emit RedeemedBonds(msg.sender, amount);
    }

    function allocateSeigniorage() external {
        uint256 cashPrice = _getCashPrice();
        (bool result, string memory reason) = _allocateSeigniorage(cashPrice);
        require(result, reason);
    }

    event Migration(address indexed target);
    event RedeemedBonds(address indexed from, uint256 amount);
    event BoughtBonds(address indexed from, uint256 amount);
    event TreasuryFunded(uint256 timestamp, uint256 seigniorage);
    event BoardroomFunded(uint256 timestamp, uint256 seigniorage);
}
