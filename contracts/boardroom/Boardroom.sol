pragma solidity ^0.6.0;

import {Math} from '@openzeppelin/contracts/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {TokenStoreProxy} from './TokenStoreProxy.sol';
import {Operator} from '../owner/Operator.sol';

/// @title Boardroom contract
/// @author Jerry Smith
contract Boardroom is Operator, TokenStoreProxy {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== EVENTS ========== */

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(address indexed user, uint256 reward);

    /* ========== DATA STRUCTURES ========== */

    struct Boardseat {
        uint256 lastSnapshotIndex;
        uint256 rewardEarned;
    }

    struct BoardSnapshot {
        uint256 timestamp;
        uint256 rewardPerShare;
    }

    /* ========== STATE VARIABLES ========== */

    address private cash;

    uint256 public rewardRate = 0;
    uint256 public periodFinish = 0;

    mapping(address => Boardseat) private directors;
    BoardSnapshot[] private boardHistory;

    /* ========== CONSTRUCTOR ========== */

    /// @notice Contract constructor
    /// @param _tokenStore TokenStore address
    /// @param _cash BAC address
    constructor(address _tokenStore, address _cash) public {
        tokenStore = _tokenStore;
        cash = _cash;
    }

    /* ========== Modifiers =============== */

    /// @dev Check if msg.sender is registered director
    modifier directorExists {
        require(
            balanceOf(msg.sender) > 0,
            'Boardroom: The director does not exist'
        );
        _;
    }

    modifier updateReward(address director) {
        uint256 rewardPerShare = rewardPerShare();
        boardHistory.push(
            BoardSnapshot({
                timestamp: block.timestamp,
                rewardPerShare: rewardPerShare
            })
        );
        if (director != address(0)) {
            Boardseat memory seat = directors[director];
            seat.rewardEarned = earned(director);
            seat.lastSnapshotIndex = latestSnapshotIndex();
            directors[director] = seat;
        }
        _;
    }

    /* ========== VIEW FUNCTIONS ========== */

    // =========== Snapshot getters

    function latestSnapshotIndex() public view returns (uint256) {
        return boardHistory.length.sub(1);
    }

    function getLatestSnapshot() internal view returns (BoardSnapshot memory) {
        return boardHistory[latestSnapshotIndex()];
    }

    function getLastSnapshotIndexOf(address director)
        public
        view
        returns (uint256)
    {
        return directors[director].lastSnapshotIndex;
    }

    function getLastSnapshotOf(address director)
        internal
        view
        returns (BoardSnapshot memory)
    {
        return boardHistory[getLastSnapshotIndexOf(director)];
    }

    // =========== Director getters

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerShare() public view returns (uint256) {
        BoardSnapshot memory snapshot = getLatestSnapshot();
        if (totalSupply() == 0) {
            return snapshot.rewardPerShare;
        }
        return
            snapshot.rewardPerShare.add(
                lastTimeRewardApplicable()
                    .sub(Math.min(periodFinish, block.timestamp))
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address director) public view returns (uint256) {
        uint256 latestRPS = getLatestSnapshot().rewardPerShare;
        uint256 storedRPS = getLastSnapshotOf(director).rewardPerShare;

        return
            balanceOf(director).mul(latestRPS.sub(storedRPS)).div(1e18).add(
                directors[director].rewardEarned
            );
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    // logic
    function stake(uint256 amount) public override updateReward(msg.sender) {
        require(amount > 0, 'Boardroom: Cannot stake 0');
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount)
        public
        override
        directorExists
        updateReward(msg.sender)
    {
        require(amount > 0, 'Boardroom: Cannot withdraw 0');
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
        claimReward();
    }

    function claimReward() public updateReward(msg.sender) {
        uint256 reward = directors[msg.sender].rewardEarned;
        if (reward > 0) {
            directors[msg.sender].rewardEarned = 0;
            IERC20(cash).safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    // reward
    function notifyInstantReward(uint256 amount) public {
        require(amount > 0, 'Boardroom: Cannot allocate 0');
        require(
            totalSupply() > 0,
            'Boardroom: Cannot allocate when totalSupply is 0'
        );

        // Create & add new snapshot
        uint256 prevRewardPerShare = getLatestSnapshot().rewardPerShare;
        uint256 nextRewardPerShare =
            prevRewardPerShare.add(amount.mul(1e18).div(totalSupply()));

        boardHistory.push(
            BoardSnapshot({
                timestamp: block.number,
                rewardPerShare: nextRewardPerShare
            })
        );

        IERC20(cash).safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(msg.sender, amount);
    }

    function notifyDelayedReward(uint256 amount)
        external
        updateReward(address(0x0))
    {
        require(
            periodFinish != 0,
            'Boardroom: need to call after at least one allocation'
        );
        require(
            block.timestamp < periodFinish,
            'Boardroom: need to call before finish'
        );
        uint256 remaining = periodFinish.sub(block.timestamp);
        rewardRate = rewardRate.add(amount.div(remaining));

        IERC20(cash).safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(msg.sender, amount);
    }

    function allocateSeigniorage(uint256 amount, uint256 nextPeriodFinish)
        external
        onlyOperator
        updateReward(address(0x0))
    {
        uint256 remaining =
            periodFinish.sub(Math.min(periodFinish, block.timestamp));
        uint256 leftover = remaining.mul(rewardRate);
        uint256 duration = nextPeriodFinish.sub(block.timestamp);

        rewardRate = amount.add(leftover).div(duration);
        periodFinish = nextPeriodFinish;

        IERC20(cash).safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(msg.sender, amount);
    }
}
