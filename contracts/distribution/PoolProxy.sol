// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {IPool} from './IPool.sol';
import {Operator} from '../access/Operator.sol';

contract PoolProxy is Operator, ERC20 {
    using SafeERC20 for IERC20;

    address public pool;
    uint256 public pid;

    constructor() ERC20('Pool Proxy Token', 'PPT') {}

    /* ================= GOV - OWNER ONLY ================= */

    function setPool(address _newPool) public onlyOwner {
        pool = _newPool;
    }

    function setPid(uint256 _newPid) public {
        pid = _newPid;
    }

    function deposit(uint256 _amount) public onlyOwner {
        _mint(address(this), _amount);
        approve(pool, _amount);
        IPool(pool).deposit(pid, _amount);
    }

    function withdraw(uint256 _amount) public onlyOwner {
        IPool(pool).withdraw(pid, _amount);
        _burn(address(this), _amount);
    }

    /* ================= TXNS - OPERATOR ONLY ================= */

    function collect() external onlyOperator returns (address, uint256) {
        IPool(pool).claimReward(pid);

        address token = IPool(pool).tokenOf(pid);
        uint256 amount = IERC20(token).balanceOf(address(this));

        IERC20(token).safeTransfer(_msgSender(), amount);

        return (token, amount);
    }
}
