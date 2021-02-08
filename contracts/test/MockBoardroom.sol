// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import '../access/Operator.sol';
import {IBoardroomV2} from '../boardroom/v2/Boardroom.sol';

contract MockBoardroom is IBoardroomV2, Operator {
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    /* ================= CALLS ================= */

    function totalSupply() external pure override returns (uint256) {
        return 0;
    }

    function balanceOf(address _owner)
        external
        pure
        override
        returns (uint256)
    {
        return uint256(_owner);
    }

    function rewardTokensAt(uint256 _index)
        external
        pure
        override
        returns (address)
    {
        return address(_index);
    }

    function rewardTokensLength() external pure override returns (uint256) {
        return 0;
    }

    function rewardPoolsAt(uint256 _index)
        external
        pure
        override
        returns (address)
    {
        return address(_index);
    }

    function rewardPoolsLength() external pure override returns (uint256) {
        return 0;
    }

    function lastSnapshotIndex(address _token)
        external
        pure
        override
        returns (uint256)
    {
        require(_token == address(0x0), 'Mock');
        return 0;
    }

    function rewardEarned(address _token, address _director)
        external
        pure
        override
        returns (uint256)
    {
        require(_token == address(0x0), 'Mock');
        require(_director == address(0x0), 'Mock');
        return 0;
    }

    /* ================= TXNS ================= */

    function deposit(uint256 _amount) external override {}

    function withdraw(uint256 _amount) external override {}

    function claimReward() external override {}

    function exit() external override {}

    function collectReward() external override {
        emit RewardCollected(msg.sender, msg.sender, msg.sender, 0);
    }
}
