pragma solidity ^0.6.0;

import "../distribution/BACDAIPool.sol";
import "../distribution/BACSUSDPool.sol";
import "../distribution/BACUSDCPool.sol";
import "../distribution/BACUSDTPool.sol";
import "../distribution/BACyCRVPool.sol";
import '../interfaces/IDistributor.sol';

contract InitialCashDistributor is IDistributor {
    using SafeMath for uint256;

    uint256 public constant TOTAL_TIMES = 5;

    uint256 public lastDistributedAt;
    uint256 public currentDistributionCount;
    uint256 private contractCreatedAt;

    IERC20 public cash;
    IRewardDistributionRecipient[] public pools;
    uint256 public rewardInterval;
    uint256 public totalInitialBalance;

    constructor(
        IERC20 _cash,
        IRewardDistributionRecipient[] memory _pools,
        uint256 _totalInitialBalance,
        uint256 _rewardInterval
    ) public {
        require(_rewardInterval != 0, "reward interval shouldn't be 0");
        require(_pools.length != 0, "a list of BAC pools are required");

        cash = _cash;
        pools = _pools;
        totalInitialBalance = _totalInitialBalance;
        rewardInterval = _rewardInterval;
        contractCreatedAt = block.timestamp;
    }

    function performDailyDistribution() public override {
        if (lastDistributedAt == 0) {
            lastDistributedAt = Math.min(contractCreatedAt, block.timestamp - rewardInterval);
        }
        uint256 timeElapsed = block.timestamp - lastDistributedAt;
        if (timeElapsed < rewardInterval) {
            revert("InitialCashDistributor: a reward interval is not elapsed since last distribution");
        }

        if (currentDistributionCount >= TOTAL_TIMES) {
            revert("InitialCashDistributor: distribution is already finished");
        }

        // for back-filling (catching up) previous period if there are missed call over the interval
        uint256 numPeriod = Math.min(timeElapsed.div(rewardInterval), TOTAL_TIMES);
        for (uint n = 0; n < numPeriod; n++) {
            for (uint i = 0; i < pools.length; i++) {
                uint256 amount = totalInitialBalance
                    .div(TOTAL_TIMES)
                    .div(pools.length);

                cash.transfer(address(pools[i]), amount);
                pools[i].notifyRewardAmount(amount);

                emit Distributed(address(pools[i]), amount);
            }
            currentDistributionCount++;
        }

        lastDistributedAt = block.timestamp;
        if (currentDistributionCount >= TOTAL_TIMES) {
            emit DistributionFinished();
        }
    }

    event Distributed(address pool, uint256 cashAmount);
    event DistributionFinished();
}
