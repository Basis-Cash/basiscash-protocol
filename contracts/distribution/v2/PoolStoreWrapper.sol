// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Context} from '@openzeppelin/contracts/utils/Context.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {IPoolStore} from './PoolStore.sol';

abstract contract PoolStoreWrapper is Context {
    using SafeERC20 for IERC20;

    IPoolStore public store;

    function deposit(uint256 _pid, uint256 _amount) public virtual {
        IERC20 token = IERC20(store.tokenOf(_pid));
        token.safeTransferFrom(_msgSender(), address(this), _amount);
        token.safeIncreaseAllowance(address(store), _amount);
        store.deposit(_pid, _msgSender(), _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) public virtual {
        store.withdraw(_pid, _msgSender(), _amount);
        IERC20(store.tokenOf(_pid)).safeTransfer(_msgSender(), _amount);
    }
}
