// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Context} from '@openzeppelin/contracts/utils/Context.sol';

import {TreasuryState} from './TreasuryState.sol';

abstract contract SeigniorageProxyGov is Context, Ownable {
    address public treasury;
    address public boardroom;
    address public bondroom;

    modifier onlyTreasury {
        require(_msgSender() == treasury, 'SeigniorageProxy: invalid treasury');

        _;
    }

    modifier onlyBoardroom {
        require(
            _msgSender() == boardroom,
            'SeigniorageProxy: invalid boardroom'
        );

        _;
    }

    modifier onlyBondroom {
        require(_msgSender() == bondroom, 'SeigniorageProxy: invalid bondroom');

        _;
    }

    function setTreasury(address _newTreasury) public onlyOwner {
        treasury = _newTreasury;
    }

    function setBoardroom(address _newBoardroom) public onlyOwner {
        boardroom = _newBoardroom;
    }
}

contract SeigniorageProxy is SeigniorageProxyGov {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    constructor(
        address _treasury,
        address _boardroom,
        address _bondroom
    ) {
        treasury = _treasury;
        boardroom = _boardroom;
        bondroom = _bondroom;
    }

    function allocateSeigniorage(uint256 _total) public onlyTreasury {
        // bondroom? boardroom?
        IERC20(TreasuryState(treasury).cash()).safeTransferFrom(
            _msgSender(),
            address(this),
            _total
        );
    }

    function collect() public onlyBoardroom returns (address, uint256) {
        address token = TreasuryState(treasury).cash();
        uint256 amount = IERC20(token).balanceOf(address(this));

        IERC20(token).safeTransfer(_msgSender(), amount);

        return (token, amount);
    }

    function emergencyWithdraw(address _token, uint256 _amount)
        public
        onlyOwner
    {
        IERC20(_token).safeTransfer(_msgSender(), _amount);
    }
}
