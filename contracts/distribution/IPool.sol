// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

interface IPool {
    /* ================= EVENTS ================= */

    event DepositToken(
        address indexed owner,
        uint256 indexed pid,
        uint256 amount
    );
    event WithdrawToken(
        address indexed owner,
        uint256 indexed pid,
        uint256 amount
    );
    event RewardClaimed(
        address indexed owner,
        uint256 indexed pid,
        uint256 amount
    );

    /* ================= CALLS ================= */

    function tokenOf(uint256 _pid) external view returns (address);

    function poolIdsOf(address _token) external view returns (uint256[] memory);

    function totalSupply(uint256 _pid) external view returns (uint256);

    function balanceOf(uint256 _pid, address _owner)
        external
        view
        returns (uint256);

    function rewardRatePerPool(uint256 _pid) external view returns (uint256);

    function rewardPerToken(uint256 _pid) external view returns (uint256);

    function rewardEarned(uint256 _pid, address _target)
        external
        view
        returns (uint256);

    /* ================= TXNS ================= */

    function massUpdate(uint256[] memory _pids) external;

    function update(uint256 _pid) external;

    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function claimReward(uint256 _pid) external;

    function exit(uint256 _pid) external;
}

interface IPoolGov {
    /* ================= EVENTS ================= */

    event RewardNotified(
        address indexed operator,
        uint256 amount,
        uint256 period
    );

    /* ================= TXNS ================= */

    function setPeriod(uint256 _startTime, uint256 _period) external;

    function setReward(uint256 _amount) external;

    function setExtraRewardRate(uint256 _extra) external;

    function stop() external;

    function migrate(address _newPool, uint256 _amount) external;
}
