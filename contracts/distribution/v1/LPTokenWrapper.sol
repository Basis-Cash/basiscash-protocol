// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Context} from '@openzeppelin/contracts/utils/Context.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract LPTokenWrapper is Context {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public lpt;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        _totalSupply = _totalSupply.add(amount);
        _balances[_msgSender()] = _balances[_msgSender()].add(amount);
        lpt.safeTransferFrom(_msgSender(), address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        _totalSupply = _totalSupply.sub(amount);
        _balances[_msgSender()] = _balances[_msgSender()].sub(amount);
        lpt.safeTransfer(_msgSender(), amount);
    }
}
