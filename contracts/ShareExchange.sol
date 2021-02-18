pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import './utils/ContractGuard.sol';

//Mint 350k Shares to this contract
contract ShareExchange is ContractGuard {
    using SafeERC20 for IERC20;

    address public share_old;
    address public share_new;

    constructor(address _share_old, address _share_new) public {
        share_old = _share_old;
        share_new = _share_new;
    }

    function exchangeShares(uint256 amount)
        external
        onlyOneBlock
    {
        require(amount > 0, 'ShareExchange: amount must be > 0');

        //reverts if amount > sender's balance, so I don't need to check if amount <= sender's balance
        IERC20(share_old).safeTransferFrom(msg.sender, address(this), amount);
        //reverts if amount > the contract's balance, so I don't need to check if amount <= contract's balance
        IERC20(share_new).safeTransfer(msg.sender, amount);

        emit ExchangedShares(msg.sender, amount);
    }

    /* ========== VIEW FUNCTIONS ========== */

    function getBalance() public view returns (uint256) {
        return IERC20(share_new).balanceOf(address(this));
    }

    // CORE
    event ExchangedShares(address indexed from, uint256 amount);
}
