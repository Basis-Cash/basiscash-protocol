// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {Math} from '@openzeppelin/contracts/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

import {Operator} from '../access/Operator.sol';
import {IPool, IPoolGov} from './IPool.sol';
import {IPoolStore, PoolStoreWrapper} from './PoolStoreWrapper.sol';

contract Distribution is IPool, IPoolGov, PoolStoreWrapper, Operator {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ================= DATA STRUCTURE ================= */

    struct User {
        uint256 amount;
        uint256 reward;
        uint256 rewardPerTokenPaid;
    }
    struct Pool {
        bool initialized;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
    }

    /* ================= STATE VARIABLES ================= */

    // share
    address public share;
    mapping(address => bool) public approvals;
    // poolId => Pool
    mapping(uint256 => Pool) public pools;
    // poolId => sender => User
    mapping(uint256 => mapping(address => User)) public users;

    bool public stopped = false;
    uint256 public rewardRate = 0;
    uint256 public rewardRateExtra = 0;

    // halving
    uint256 public rewardRateBeforeHalve = 0;

    // control
    uint256 public period = 0;
    uint256 public periodFinish = 0;
    uint256 public startTime = 0;

    /* ================= CONSTRUCTOR ================= */

    constructor(address _share, address _poolStore) Ownable() {
        share = _share;
        store = IPoolStore(_poolStore);
    }

    /* ================= GOV - OWNER ONLY ================= */

    /**
     * @param _startTime starting time to distribute
     * @param _period distribution period
     */
    function setPeriod(uint256 _startTime, uint256 _period)
        public
        override
        onlyOperator
    {
        // re-calc
        if (startTime <= block.timestamp && block.timestamp < periodFinish) {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = leftover.div(_period);
        }

        period = _period;
        startTime = _startTime;
        periodFinish = _startTime.add(_period);
    }

    /**
     * @param _amount token amount to distribute
     */
    function setReward(uint256 _amount) public override onlyOperator {
        require(block.timestamp < periodFinish, 'BACPool: already finished');

        if (startTime <= block.timestamp) {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = _amount.add(leftover).div(
                periodFinish.sub(block.timestamp)
            );
        } else {
            rewardRate = rewardRate.add(
                _amount.div(periodFinish.sub(startTime))
            );
        }
    }

    function setExtraRewardRate(uint256 _extra) public override onlyOwner {
        rewardRateExtra = _extra;
    }

    /**
     * @dev STOP DISTRIBUTION
     */
    function stop() public override onlyOwner {
        periodFinish = block.timestamp;
        stopped = true;
    }

    /**
     * @dev MUST UPDATE ALL POOL REWARD BEFORE MIGRATION!!!!!
     * @param _newPool new pool address to migrate
     */
    function migrate(address _newPool, uint256 _amount)
        public
        override
        onlyOwner
    {
        require(stopped, 'BACPool: not stopped');
        IERC20(share).safeTransfer(_newPool, _amount);

        uint256 remaining = startTime.add(period).sub(periodFinish);
        uint256 leftover = remaining.mul(rewardRate);
        IPoolGov(_newPool).setPeriod(block.timestamp.add(1), remaining);
        IPoolGov(_newPool).setReward(leftover);
    }

    /* ================= MODIFIER ================= */

    /**
     * @param _pid pool id
     * @param _target update target. if is empty, skip individual update.
     */
    modifier updateReward(uint256 _pid, address _target) {
        if (!approvals[store.tokenOf(_pid)]) {
            IERC20(store.tokenOf(_pid)).safeApprove(
                address(store),
                type(uint256).max
            );
            approvals[store.tokenOf(_pid)] = true;
        }

        if (block.timestamp >= startTime) {
            if (!pools[_pid].initialized) {
                pools[_pid] = Pool({
                    initialized: true,
                    rewardRate: rewardRate,
                    lastUpdateTime: startTime,
                    rewardPerTokenStored: 0
                });
            }

            // halve
            if (!stopped && block.timestamp >= periodFinish) {
                // decrease reward rate
                rewardRateBeforeHalve = rewardRate;
                rewardRate = rewardRate.mul(75).div(100);

                // set period
                startTime = block.timestamp;
                periodFinish = block.timestamp.add(period);
            }

            Pool memory pool = pools[_pid];
            pool.rewardPerTokenStored = rewardPerToken(_pid);
            if (pool.rewardRate == rewardRateBeforeHalve) {
                pool.rewardRate = rewardRate;
            }
            pool.lastUpdateTime = applicableRewardTime();
            pools[_pid] = pool;

            if (_target != address(0x0)) {
                User memory user = users[_pid][_target];
                user.reward = rewardEarned(_pid, _target);
                user.rewardPerTokenPaid = pool.rewardPerTokenStored;
                users[_pid][_target] = user;
            }
        }

        _;
    }

    /* ================= CALLS - ANYONE ================= */

    /**
     * @param _pid pool id
     * @return pool token address
     */
    function tokenOf(uint256 _pid) external view override returns (address) {
        return store.tokenOf(_pid);
    }

    /**
     * @param _token pool token address
     * @return pool id
     */
    function poolIdsOf(address _token)
        external
        view
        override
        returns (uint256[] memory)
    {
        return store.poolIdsOf(_token);
    }

    /**
     * @param _pid pool id
     * @return pool's total staked amount
     */
    function totalSupply(uint256 _pid)
        external
        view
        override
        returns (uint256)
    {
        return store.totalSupply(_pid);
    }

    /**
     * @param _owner staker address
     * @return staker balance
     */
    function balanceOf(uint256 _pid, address _owner)
        external
        view
        override
        returns (uint256)
    {
        return store.balanceOf(_pid, _owner);
    }

    /**
     * @return applicable reward time
     */
    function applicableRewardTime() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    /**
     * @param _pid pool id
     * @param _crit reward rate
     */
    function _rewardRatePerPool(uint256 _pid, uint256 _crit)
        internal
        view
        returns (uint256)
    {
        return _crit.mul(store.weightOf(_pid)).div(store.totalWeight());
    }

    /**
     * @param _pid pool id
     * @return calculated reward rate per pool
     */
    function rewardRatePerPool(uint256 _pid)
        public
        view
        override
        returns (uint256)
    {
        return _rewardRatePerPool(_pid, rewardRate.add(rewardRateExtra));
    }

    /**
     * @param _pid pool id
     * @return RPT per pool
     */
    function rewardPerToken(uint256 _pid)
        public
        view
        override
        returns (uint256)
    {
        Pool memory pool = pools[_pid];
        if (store.totalSupply(_pid) == 0 || block.timestamp < startTime) {
            return pool.rewardPerTokenStored;
        }

        if (pool.rewardRate != 0 && pool.rewardRate == rewardRateBeforeHalve) {
            uint256 beforeHalve =
                startTime
                    .sub(pool.lastUpdateTime)
                    .mul(_rewardRatePerPool(_pid, rewardRateBeforeHalve))
                    .mul(1e18)
                    .div(store.totalSupply(_pid));
            uint256 afterHalve =
                applicableRewardTime()
                    .sub(startTime)
                    .mul(rewardRatePerPool(_pid))
                    .mul(1e18)
                    .div(store.totalSupply(_pid));
            return pool.rewardPerTokenStored.add(beforeHalve).add(afterHalve);
        } else {
            return
                pool.rewardPerTokenStored.add(
                    applicableRewardTime()
                        .sub(pool.lastUpdateTime)
                        .mul(rewardRatePerPool(_pid))
                        .mul(1e18)
                        .div(store.totalSupply(_pid))
                );
        }
    }

    /**
     * @param _pid pool id
     * @param _target target address
     * @return reward amount per pool
     */
    function rewardEarned(uint256 _pid, address _target)
        public
        view
        override
        returns (uint256)
    {
        User memory user = users[_pid][_target];
        return
            store
                .balanceOf(_pid, _target)
                .mul(rewardPerToken(_pid).sub(user.rewardPerTokenPaid))
                .div(1e18)
                .add(user.reward);
    }

    /* ================= TXNS - ANYONE ================= */

    /**
     * @param _pids array of pool ids
     */
    function massUpdate(uint256[] memory _pids) public override {
        for (uint256 i = 0; i < _pids.length; i++) {
            update(_pids[i]);
        }
    }

    /**
     * @param _pid pool id
     */
    function update(uint256 _pid)
        public
        override
        updateReward(_pid, address(0x0))
    {}

    /**
     * @param _pid pool id
     * @param _amount deposit amount
     */
    function deposit(uint256 _pid, uint256 _amount)
        public
        override(IPool, PoolStoreWrapper)
        updateReward(_pid, _msgSender())
    {
        require(!stopped, 'BASPool: stopped');
        super.deposit(_pid, _amount);
        emit DepositToken(_msgSender(), _pid, _amount);
    }

    /**
     * @param _pid pool id
     * @param _amount withdraw amount
     */
    function withdraw(uint256 _pid, uint256 _amount)
        public
        override(IPool, PoolStoreWrapper)
        updateReward(_pid, _msgSender())
    {
        require(!stopped, 'BASPool: stopped');
        super.withdraw(_pid, _amount);
        emit WithdrawToken(_msgSender(), _pid, _amount);
    }

    /**
     * @param _pid pool id
     */
    function claimReward(uint256 _pid)
        public
        override
        updateReward(_pid, _msgSender())
    {
        uint256 reward = users[_pid][_msgSender()].reward;
        if (reward > 0) {
            users[_pid][_msgSender()].reward = 0;
            IERC20(share).safeTransfer(_msgSender(), reward);
            emit RewardClaimed(_msgSender(), _pid, reward);
        }
    }

    /**
     * @dev withdraw + claim
     * @param _pid pool id
     */
    function exit(uint256 _pid) external override {
        withdraw(_pid, store.balanceOf(_pid, _msgSender()));
        claimReward(_pid);
    }
}
