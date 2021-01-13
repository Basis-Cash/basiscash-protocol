pragma solidity ^0.6.0;

import {ITokenStore} from './ITokenStore.sol';

interface IBoardroom is ITokenStore {
    function earned(address) external view returns (uint256);

    function exit() external;

    function claimReward() external;

    function notifyInstantReward(uint256) external;

    function notifyDelayedReward(uint256) external;

    function allocateSeigniorage(uint256, uint256) external;
}
