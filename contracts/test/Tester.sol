pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../Treasury.sol';
import '../Boardroom.sol';
import '../owner/Operator.sol';

contract Tester is Operator {
    Treasury public treasury;
    Boardroom public boardroom;

    constructor(address _treasury, address _boardroom) public {
        treasury = Treasury(_treasury);
        boardroom = Boardroom(_boardroom);
    }

    event OKOnlyOperator(address caller);

    function OnlyOperator() public onlyOperator {
        emit OKOnlyOperator(msg.sender);
    }

    function actionTreasury() public {
        treasury.allocateSeigniorage();
        treasury.allocateSeigniorage(); // should revert
    }

    function actionBoardroom(address share, uint256 amount) public {
        IERC20(share).approve(address(boardroom), amount);
        boardroom.stake(amount);
        boardroom.withdraw(amount); // should revert
    }
}
