// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import 'hardhat/console.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/EnumerableSet.sol';

import {ITokenStore, TokenStoreWrapper} from './TokenStoreWrapper.sol';

interface IRewardPool {
    function collect() external returns (address, uint256);
}

interface IBoardroomV2 {
    /* ================= EVENTS ================= */

    event DepositShare(address indexed owner, uint256 amount);
    event WithdrawShare(address indexed owner, uint256 amount);
    event RewardClaimed(
        address indexed owner,
        address indexed token,
        uint256 amount
    );
    event RewardCollected(
        address indexed operator,
        address indexed target,
        address indexed token,
        uint256 amount
    );
    event RewardCollectionFailedWithReason(
        address indexed operator,
        address indexed target,
        string reason
    );
    event RewardCollectionFailedWithData(
        address indexed operator,
        address indexed target,
        bytes data
    );

    /* ================= CALLS ================= */

    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256);

    function rewardTokensAt(uint256 index) external view returns (address);

    function rewardTokensLength() external view returns (uint256);

    function rewardPoolsAt(uint256 index) external view returns (address);

    function rewardPoolsLength() external view returns (uint256);

    function lastSnapshotIndex(address _token) external view returns (uint256);

    function rewardEarned(address _token, address _director)
        external
        view
        returns (uint256);

    /* ================= TXNS ================= */

    function deposit(uint256 _amount) external;

    function withdraw(uint256 _amount) external;

    function claimReward() external;

    function exit() external;

    function collectReward() external;
}

interface IBoardroomV2Gov {
    /* ================= EVENTS ================= */

    event RewardTokenAdded(address indexed operator, address token);
    event RewardTokenRemoved(address indexed operator, address token);
    event RewardPoolAdded(address indexed operator, address pool);
    event RewardPoolRemoved(address indexed operator, address pool);

    /* ================= TXNS ================= */

    function migrate() external;

    function addRewardToken(address _token) external;

    function removeRewardToken(address _token) external;

    function addRewardPool(address _pool) external;

    function removeRewardPool(address _pool) external;
}

contract BoardroomV2 is
    IBoardroomV2,
    IBoardroomV2Gov,
    TokenStoreWrapper,
    Ownable
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    /* ================= DATA STRUCTURES ================= */

    struct Boardseat {
        uint256 lastSnapshotIndex;
        uint256 rewardEarned;
    }

    struct BoardSnapshot {
        uint256 at;
        uint256 rewardReceived;
        uint256 rewardPerShare;
    }

    /* ================= STATE VARIABLES ================= */

    bool public migrated;

    EnumerableSet.AddressSet private rewardTokens;
    EnumerableSet.AddressSet private rewardPools;

    BoardSnapshot genesis =
        BoardSnapshot({at: block.number, rewardReceived: 0, rewardPerShare: 0});
    mapping(address => BoardSnapshot[]) public history;
    mapping(address => mapping(address => Boardseat)) public seats;

    /* ================= CONSTRUCTOR ================= */

    constructor(
        address _cash,
        address _share,
        address _store
    ) {
        share = IERC20(_share);
        store = ITokenStore(_store);

        addRewardToken(_cash);
        addRewardToken(_share);
    }

    /* ================= GOV - OWNER ONLY ================= */

    /**
     * @dev blocks deposit function
     */
    function migrate() external override onlyOwner {
        migrated = true;
    }

    /**
     * @param _token reward token address
     */
    function addRewardToken(address _token) public override onlyOwner {
        rewardTokens.add(_token);
        history[_token].push(genesis);
        emit RewardTokenAdded(_msgSender(), _token);
    }

    /**
     * @param _token reward token address
     */
    function removeRewardToken(address _token) public override onlyOwner {
        rewardTokens.remove(_token);
        emit RewardTokenRemoved(_msgSender(), _token);
    }

    /**
     * @param _pool reward pool address
     */
    function addRewardPool(address _pool) public override onlyOwner {
        rewardPools.add(_pool);
        emit RewardPoolAdded(_msgSender(), _pool);
    }

    /**
     * @param _pool reward pool address
     */
    function removeRewardPool(address _pool) public override onlyOwner {
        rewardPools.remove(_pool);
        emit RewardPoolRemoved(_msgSender(), _pool);
    }

    /* ================= MODIFIERS ================= */

    modifier checkMigration {
        require(!migrated, 'Boardroom: migrated');

        _;
    }

    modifier directorExists {
        require(store.balanceOf(_msgSender()) > 0, 'Boardroom: absent');

        _;
    }

    /**
     * @param _director staker address
     */
    modifier updateReward(address _director) {
        collectReward();

        for (uint256 i = 0; i < rewardTokens.length(); i++) {
            address token = rewardTokens.at(i);

            if (_director != address(0x0)) {
                Boardseat memory seat = seats[token][_director];
                seat.rewardEarned = rewardEarned(token, _director);
                seat.lastSnapshotIndex = lastSnapshotIndex(token);
                seats[token][_director] = seat;
            }
        }

        _;
    }

    /* ================= CALLS - ANYONE ================= */

    /**
     * @return total staked amount
     */
    function totalSupply() external view override returns (uint256) {
        return store.totalSupply();
    }

    /**
     * @param _owner staker address
     * @return staker balance
     */
    function balanceOf(address _owner)
        external
        view
        override
        returns (uint256)
    {
        return store.balanceOf(_owner);
    }

    /**
     * @param _index of reward token
     * @return reward token address
     */
    function rewardTokensAt(uint256 _index)
        external
        view
        override
        returns (address)
    {
        return rewardTokens.at(_index);
    }

    /**
     * @return total count of reward tokens
     */
    function rewardTokensLength() external view override returns (uint256) {
        return rewardTokens.length();
    }

    /**
     * @param _index of reward pool
     * @return reward pool address
     */
    function rewardPoolsAt(uint256 _index)
        external
        view
        override
        returns (address)
    {
        return rewardPools.at(_index);
    }

    /**
     * @return total count of reward pools
     */
    function rewardPoolsLength() external view override returns (uint256) {
        return rewardPools.length();
    }

    /**
     * @param _token reward token address
     * @return last snapshot index of token history
     */
    function lastSnapshotIndex(address _token)
        public
        view
        override
        returns (uint256)
    {
        return history[_token].length.sub(1);
    }

    /**
     * @param _token reward token address
     * @return last snapshot of token history
     */
    function getLastSnapshot(address _token)
        internal
        view
        returns (BoardSnapshot memory)
    {
        return history[_token][lastSnapshotIndex(_token)];
    }

    /**
     * @param _token reward token address
     * @param _director staker address
     * @return last snapshot of director
     */
    function getLastSnapshotOf(address _token, address _director)
        internal
        view
        returns (BoardSnapshot memory)
    {
        return history[_token][seats[_token][_director].lastSnapshotIndex];
    }

    /**
     * @param _token reward token address
     * @param _director staker address
     * @return reward earned
     */
    function rewardEarned(address _token, address _director)
        public
        view
        override
        returns (uint256)
    {
        uint256 latestRPS = getLastSnapshot(_token).rewardPerShare;
        uint256 storedRPS = getLastSnapshotOf(_token, _director).rewardPerShare;

        return
            store
                .balanceOf(_director)
                .mul(latestRPS.sub(storedRPS))
                .div(1e18)
                .add(seats[_token][_director].rewardEarned);
    }

    /* ================= TXNS ================= */

    /**
     * @dev deposit tokens to boardroom
     * @param _amount deposit amount of tokens
     */
    function deposit(uint256 _amount)
        public
        override(IBoardroomV2, TokenStoreWrapper)
        checkMigration
        updateReward(_msgSender())
    {
        super.deposit(_amount);
        emit DepositShare(_msgSender(), _amount);
    }

    /**
     * @dev withdraw tokens from boardroom
     * @param _amount amount of staked tokens
     */
    function withdraw(uint256 _amount)
        public
        override(IBoardroomV2, TokenStoreWrapper)
        directorExists
        updateReward(_msgSender())
    {
        super.withdraw(_amount);
        emit WithdrawShare(_msgSender(), _amount);
    }

    /**
     * @dev receive collected rewards
     */
    function claimReward() public override updateReward(_msgSender()) {
        for (uint256 i = 0; i < rewardTokens.length(); i++) {
            address token = rewardTokens.at(i);
            uint256 reward = seats[token][_msgSender()].rewardEarned;
            if (reward > 0) {
                seats[token][_msgSender()].rewardEarned = 0;
                IERC20(token).safeTransfer(_msgSender(), reward);
                emit RewardClaimed(_msgSender(), token, reward);
            }
        }
    }

    /**
     * @dev withdraw + claim reward
     */
    function exit() external override {
        withdraw(store.balanceOf(_msgSender()));
        claimReward();
    }

    /**
     * @dev collect rewards from pools
     */
    function collectReward() public override {
        if (store.totalSupply() > 0) {
            for (uint256 i = 0; i < rewardPools.length(); i++) {
                try IRewardPool(rewardPools.at(i)).collect() returns (
                    address token,
                    uint256 amount
                ) {
                    if (amount == 0) {
                        continue;
                    }

                    uint256 prevRPS = getLastSnapshot(token).rewardPerShare;
                    uint256 nextRPS =
                        prevRPS.add(amount.mul(1e18).div(store.totalSupply()));

                    BoardSnapshot memory newSnapshot =
                        BoardSnapshot({
                            at: block.number,
                            rewardReceived: amount,
                            rewardPerShare: nextRPS
                        });
                    history[token].push(newSnapshot);

                    emit RewardCollected(
                        _msgSender(),
                        rewardPools.at(i),
                        token,
                        amount
                    );
                } catch Error(string memory reason) {
                    emit RewardCollectionFailedWithReason(
                        _msgSender(),
                        rewardPools.at(i),
                        reason
                    );
                }
            }
        }
    }
}
