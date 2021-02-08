// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {Math} from '@openzeppelin/contracts/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {IRewardPool} from '../boardroom/v2/Boardroom.sol';

contract MockBoardroomPool is IRewardPool {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public token;
    uint256 public tokenPerCall;
    bool public no;

    constructor(
        address _token,
        uint256 _amount,
        uint256 _slice,
        bool _no
    ) {
        token = _token;
        tokenPerCall = _amount.div(_slice);
        no = _no;
    }

    function collect() external override returns (address, uint256) {
        require(!no, 'Pool: nonono');
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) {
            return (token, balance);
        }

        uint256 amount = Math.min(balance, tokenPerCall);
        IERC20(token).safeTransfer(msg.sender, amount);
        return (token, amount);
    }
}
