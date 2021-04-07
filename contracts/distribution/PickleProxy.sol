// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {Distribution} from './Distribution.sol';
import {IPool} from './IPool.sol';
import {IPoolStore} from './PoolStore.sol';
import {Operator} from '../access/Operator.sol';

interface IShareRewardPool {
    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function pendingShare(uint256 _pid, address _user)
        external
        view
        returns (uint256);

    function userInfo(uint256 _pid, address _user)
        external
        view
        returns (uint256, uint256);

    function emergencyWithdraw(uint256 _pid) external;
}

contract PickleProxy is Operator, ERC20, IShareRewardPool {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public pool;
    uint256 public pid;

    constructor() ERC20('Vault Proxy Token', 'VPT') {}

    /* ================= GOV - OWNER ONLY ================= */

    function setPool(address _newPool) public onlyOwner {
        pool = _newPool;
    }

    function setPid(uint256 _newPid) public onlyOwner {
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

    function deposit(uint256, uint256 _amount) public override onlyOperator {
        IERC20 token = IERC20(IPool(pool).tokenOf(pid));
        token.safeTransferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(uint256, uint256 _amount) public override onlyOperator {
        IERC20 token = IERC20(IPool(pool).tokenOf(pid));
        token.safeTransfer(msg.sender, _amount);
    }

    function pendingShare(uint256, address)
        public
        view
        override
        returns (uint256)
    {
        return IPool(pool).rewardEarned(pid, address(this));
    }

    function userInfo(uint256, address)
        public
        view
        override
        returns (uint256, uint256)
    {
        return (IPool(pool).balanceOf(pid, address(this)), uint256(0));
    }

    function emergencyWithdraw(uint256) public override onlyOperator {
        IPoolStore(Distribution(pool).store()).emergencyWithdraw(pid);
        IERC20 token = IERC20(IPool(pool).tokenOf(pid));
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }
}
