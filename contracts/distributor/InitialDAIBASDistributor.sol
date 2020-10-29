pragma solidity ^0.6.0;

import "../distribution/DAIBASLPTokenSharePool.sol";
import "../interfaces/IDistributor.sol";

contract InitialDAIBASDistributor is IDistributor {
    using SafeMath for uint256;

    // ================== events
    event Distributed(address pool, uint256 cashAmount);
    event DistributionFinished();

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
    uint256 public startingAmount;
    uint256 public deflationRate;
    uint256 public deflationInterval;

    /**
     * @notice do not assign floating number to deflation rate (use percentage 75% = 75)
     */
    constructor(
        IERC20 _share,
        IRewardDistributionRecipient _pool,
        uint256 _totalInitialBalance,
        uint256 _startingAmount,
        uint256 _deflationRate,
        uint256 _deflationInterval,
        uint256 _rewardInterval
    ) public {
        require(_rewardInterval != 0, "reward interval shouldn't be 0");

        share = _share;
        pool = _pool;
        totalInitialBalance = _totalInitialBalance;
        startingAmount = _startingAmount;
        deflationRate = _deflationRate;
        deflationInterval = _deflationInterval;
        rewardInterval = _rewardInterval;
        contractCreatedAt = block.timestamp;
    }

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
                "InitialDAIBASDistributor: a reward interval is not elapsed since last distribution"
            );
        }

        // for back-filling
        uint256 numPeriod = timeElapsed.div(rewardInterval);
        for (uint256 n = 0; n < numPeriod; n++) {
            // floor(x / deflationInterval)
            uint256 level = currentDistributionCount.div(deflationInterval); // auto-floored level
            // balance * deflationRate^level / 100^level
            uint256 amount = startingAmount.mul(deflationRate**level).div(
                100**level
            );

            share.transfer(address(pool), amount);
            pool.notifyRewardAmount(amount);

            emit Distributed(address(pool), amount);

            currentDistributionCount++;
        }

        lastDistributedAt = block.timestamp;
        emit DistributionFinished();
    }
}
