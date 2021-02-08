// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import './access/Operator.sol';

contract VoteProxy is Operator {
    // Events
    event BoardroomChanged(
        address indexed operator,
        address indexed oldBoardroom,
        address indexed newBoardroom
    );

    // Boardroom
    address public boardroom;

    constructor(address _boardroom) {
        boardroom = _boardroom;
    }

    function setBoardroom(address newBoardroom) public onlyOperator {
        address oldBoardroom = boardroom;
        boardroom = newBoardroom;
        emit BoardroomChanged(_msgSender(), oldBoardroom, newBoardroom);
    }

    function decimals() external pure returns (uint8) {
        return uint8(18);
    }

    function name() external pure returns (string memory) {
        return 'BAS in Boardroom';
    }

    function symbol() external pure returns (string memory) {
        return 'SBAS';
    }

    function totalSupply() external view returns (uint256) {
        return IERC20(boardroom).totalSupply();
    }

    function balanceOf(address _voter) external view returns (uint256) {
        return IERC20(boardroom).balanceOf(_voter);
    }
}
