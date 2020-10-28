pragma solidity ^0.6.0;

import "../distribution/DAIBACLPTokenSharePool.sol";
import "../distribution/DAIBASLPTokenSharePool.sol";
import "../interfaces/IDistributor.sol";

contract InitialShareDistributor is IDistributor {
    using SafeMath for uint256;

    // ================== events
    event Distributed(address pool, uint256 cashAmount);
    event DistributionFinished();

    // ================== distribution limit
    uint256 public constant DAIBAC_TOTAL_TIMES = 365;
    //uint256 public constant DAIBAS_TOTAL_TIMES = infinite;

    // ================== helper variables
    uint256 public lastDistributedAt = 0;
    uint256 public currentDistributionCount = 0;
    uint256 private contractCreatedAt; // timestamp

    // ================== external contracts
    IERC20 public share;
    IRewardDistributionRecipient public poolDAIBAC;
    IRewardDistributionRecipient public poolDAIBAS;

    // ================== parameters
    uint256 public rewardInterval;
    uint256 public totalBalanceForDAIBAC;
    uint256 public totalBalanceForDAIBAS;
    uint256 public startingAmountForDAIBAS;
    uint256 public deflationRateForDAIBAS;
    uint256 public deflationIntervalForDAIBAS;

    /**
     * @notice do not assign floating number to deflation rate (use percentage 75% = 75)
     */
    constructor(
        IERC20 _share,
        IRewardDistributionRecipient _poolDAIBAC,
        IRewardDistributionRecipient _poolDAIBAS,
        uint256 _totalBalanceForDAIBAC,
        uint256 _totalBalanceForDAIBAS,
        uint256 _startingAmountForDAIBAS,
        uint256 _deflationRateForDAIBAS,
        uint256 _deflationIntervalForDAIBAS,
        uint256 _rewardInterval
    ) public {
        require(_rewardInterval != 0, "reward interval shouldn't be 0");

        share = _share;
        poolDAIBAC = _poolDAIBAC;
        poolDAIBAS = _poolDAIBAS;
        totalBalanceForDAIBAC = _totalBalanceForDAIBAC;
        totalBalanceForDAIBAS = _totalBalanceForDAIBAS;
        startingAmountForDAIBAS = _startingAmountForDAIBAS;
        deflationRateForDAIBAS = _deflationRateForDAIBAS;
        deflationIntervalForDAIBAS = _deflationIntervalForDAIBAS;
        rewardInterval = _rewardInterval;
        contractCreatedAt = block.timestamp;
    }

    /**
     * @notice distribution amount = balance / 365
     */
    function distributeToDAIBACPool() private {
        uint256 amount = totalBalanceForDAIBAC.div(DAIBAC_TOTAL_TIMES);
        share.transfer(address(poolDAIBAC), amount);
        poolDAIBAC.notifyRewardAmount(amount);

        emit Distributed(address(poolDAIBAC), amount);
    }

    /**
     * @notice distribution amount = balance * deflationRate^floor(x / deflationInterval)
     */
    function distributeToDAIBASPool() private {
        // floor(x / deflationInterval)
        uint256 level = currentDistributionCount.div(
            deflationIntervalForDAIBAS
        ); // auto-floored level
        // balance * deflationRate^level / 100^level
        uint256 amount = startingAmountForDAIBAS
            .mul(deflationRateForDAIBAS**level)
            .div(100**level);

        share.transfer(address(poolDAIBAS), amount);
        poolDAIBAS.notifyRewardAmount(amount);

        emit Distributed(address(poolDAIBAS), amount);
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
                "InitialShareDistributor: a reward interval is not elapsed since last distribution"
            );
        }

        // for back-filling
        uint256 numPeriod = Math.min(
            timeElapsed.div(rewardInterval),
            DAIBAC_TOTAL_TIMES
        );
        for (uint256 n = 0; n < numPeriod; n++) {
            if (currentDistributionCount < DAIBAC_TOTAL_TIMES) {
                distributeToDAIBACPool();
            }
            distributeToDAIBASPool();

            currentDistributionCount++;
        }

        lastDistributedAt = block.timestamp;
        emit DistributionFinished();
    }
}
