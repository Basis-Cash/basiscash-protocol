// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {IFeeder} from './Feeder.sol';
import {IBasisAsset} from '../assets/IBasisAsset.sol';

contract Swap is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event TokenSwapped(
        address indexed sender,
        address v1,
        address v2,
        uint256 amount
    );

    address public v1;
    address public v2;
    address public feeder;
    uint256 public expiry;
    uint256 public startTime;
    uint256 public swapAmount = 0;

    constructor(
        address _v1,
        address _v2,
        address _feeder,
        uint256 _startTime,
        uint256 _period
    ) {
        v1 = _v1;
        v2 = _v2;
        feeder = _feeder;
        expiry = _startTime.add(_period);
        startTime = _startTime;
    }

    function swap(uint256 _amount) public {
        require(block.timestamp >= startTime, 'Swap: not started');
        require(block.timestamp < expiry, 'Swap: finished');

        swapAmount = swapAmount.add(_amount);
        IERC20(v1).safeTransferFrom(_msgSender(), address(this), _amount);
        IBasisAsset(v2).mint(_msgSender(), _amount);

        IFeeder(feeder).feed(); // feeeeeeeeeeeed

        emit TokenSwapped(_msgSender(), v1, v2, _amount);
    }
}
