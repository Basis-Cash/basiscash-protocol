// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {Operator} from '../../access/Operator.sol';
import {IPool} from '../../distribution/v2/IPool.sol';
import {IRewardPool} from './Boardroom.sol';

contract PoolWrapper is IRewardPool, Operator, ERC20 {
    using SafeERC20 for IERC20;

    IPool public pool;
    uint256 public pid;

    constructor(address _pool, uint256 _pid) ERC20('BAS Pool Wrapper', 'BPW') {
        pool = IPool(_pool);
        pid = _pid;

        _mint(msg.sender, 1e18);
    }

    /* ================= GOV - OWNER ONLY ================= */

    function deposit(uint256 _amount) public onlyOwner {
        _mint(address(this), _amount);
        approve(address(pool), _amount);
        pool.deposit(pid, _amount);
    }

    function withdraw(uint256 _amount) public onlyOwner {
        pool.withdraw(pid, _amount);
        _burn(address(this), _amount);
    }

    /* ================= TXNS - OPERATOR ONLY ================= */

    function collect()
        external
        override
        onlyOperator
        returns (address, uint256)
    {
        pool.claimReward(pid);

        address token = pool.tokenOf(pid);
        uint256 amount = IERC20(token).balanceOf(address(this));

        IERC20(token).safeTransfer(_msgSender(), amount);

        return (token, amount);
    }
}
