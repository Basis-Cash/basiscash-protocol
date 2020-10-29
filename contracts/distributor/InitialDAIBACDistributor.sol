pragma solidity ^0.6.0;

import "../distribution/DAIBACLPTokenSharePool.sol";
import "../interfaces/IDistributor.sol";

contract InitialDAIBACDistributor is IDistributor {
    using SafeMath for uint256;

    // ================== events
    event Distributed(address pool, uint256 cashAmount);
    event DistributionFinished();

    // ================== distribution limit
    uint256 public constant DAIBAC_TOTAL_TIMES = 365;

    // ================== helper variables
    uint256 public lastDistributedAt = 0;
    uint256 public currentDistributionCount = 0;
    uint256 private contractCreatedAt; // timestamp

    // ================== external contracts
    IERC20 public share;
    IRewardDistributionRecipient public pool;

    // ================== parameters
    uint256 public rewardInterval;
    uint256 public totalInitialBalance;

    /**
     * @notice do not assign floating number to deflation rate (use percentage 75% = 75)
     */
    constructor(
        IERC20 _share,
        IRewardDistributionRecipient _pool,
        uint256 _totalInitialBalance,
        uint256 _rewardInterval
    ) public {
        require(_rewardInterval != 0, "reward interval shouldn't be 0");

        share = _share;
        pool = _pool;
        totalInitialBalance = _totalInitialBalance;
        rewardInterval = _rewardInterval;
        contractCreatedAt = block.timestamp;
    }

    /**
     * @notice distribution amount = balance / 365
     */
    function distributeToDAIBACPool() private {}

    /**
     * @notice this function should be called at least once a day
     */
    function performDailyDistribution() public override {
        if (lastDistributedAt == 0) {
            lastDistributedAt = Math.min(
                contractCreatedAt,
                block.timestamp - rewardInterval
            );
        }
        uint256 timeElapsed = block.timestamp - lastDistributedAt;
        if (timeElapsed < rewardInterval) {
            revert(
                "InitialDAIBACDistributor: a reward interval is not elapsed since last distribution"
            );
        }

        if (currentDistributionCount >= DAIBAC_TOTAL_TIMES) {
            revert(
                "InitialDAIBACDistributor: distribution is already finished"
            );
        }

        // for back-filling
        uint256 numPeriod = Math.min(
            timeElapsed.div(rewardInterval),
            DAIBAC_TOTAL_TIMES
        );
        for (uint256 n = 0; n < numPeriod; n++) {
            uint256 amount = totalInitialBalance.div(DAIBAC_TOTAL_TIMES);
            share.transfer(address(pool), amount);
            pool.notifyRewardAmount(amount);

            emit Distributed(address(pool), amount);
            currentDistributionCount++;
        }

        lastDistributedAt = block.timestamp;
        emit DistributionFinished();
    }
}
