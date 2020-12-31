pragma solidity ^0.6.0;

import '../distribution/MICDAIPool.sol';
import '../distribution/MICUSDTPool.sol';
import '../distribution/MICESDPool.sol';
import '../distribution/MICBACPool.sol';
import '../distribution/MICMITHPool.sol';
import '../distribution/MICCREAMPool.sol';
import '../distribution/MICFRAXPool.sol';
import '../distribution/MICYFIPool.sol';
import '../distribution/MICCRVPool.sol';
import '../distribution/MICBUSDPool.sol';
import '../distribution/MICLINKPool.sol';
import '../distribution/MICCOMPPool.sol';
import '../distribution/MICAAVEPool.sol';
import '../distribution/MICUSDCPool.sol';
import '../distribution/MICSUSHIPool.sol';
import '../distribution/MICSUSDPool.sol';
import '../interfaces/IDistributor.sol';

contract InitialCashDistributor is IDistributor {
    using SafeMath for uint256;

    event Distributed(address pool, uint256 cashAmount);

    bool public once = true;

    IERC20 public cash;
    IRewardDistributionRecipient[] public pools;
    uint256 public totalInitialBalance;

    constructor(
        IERC20 _cash,
        IRewardDistributionRecipient[] memory _pools,
        uint256 _totalInitialBalance
    ) public {
        require(_pools.length != 0, 'a list of BAC pools are required');

        cash = _cash;
        pools = _pools;
        totalInitialBalance = _totalInitialBalance;
    }

    function distribute() public override {
        require(
            once,
            'InitialCashDistributor: you cannot run this function twice'
        );

        for (uint256 i = 0; i < pools.length; i++) {
            uint256 amount = totalInitialBalance.div(pools.length);

            cash.transfer(address(pools[i]), amount);
            pools[i].notifyRewardAmount(amount);

            emit Distributed(address(pools[i]), amount);
        }

        once = false;
    }
}
