pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import './interfaces/IOracle.sol';
import './utils/ContractGuard.sol';

contract CashExchange is ContractGuard {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;


    /* ========== STATE VARIABLES ========== */

    // ========== CORE

    uint256 public endTime;

    address public cash_old;
    address public cash_new;

    address public cashOracle;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash_old,
        address _cash_new,
        address _cashOracle,
        uint256 _endTime
    ) public {
        cash_old = _cash_old;
        cash_new = _cash_new;
        cashOracle = _cashOracle;
        endTime = _endTime;
    }

    /* ========== VIEW FUNCTIONS ========== */

    // oracle
    function getOraclePrice() public view returns (uint256) {
        return IOracle(cashOracle).consult(cash_old, 1e18);
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    function _updateCashPrice() internal {
        try IOracle(cashOracle).update()  {} catch {}
    }

    function exchangeCash(uint256 amount)
        external
        onlyOneBlock
    {
        require(block.timestamp <= endTime, 'CashExchange: redemption period ended');
        require(amount > 0, 'CashExchange: cannot exchange zero amount');

        uint256 cashPrice = getOraclePrice();
        //Note: Given that we want to force the starting point to be $1, if cash is > $1 (probably due to low liquidity), redeem it as $1
        if (cashPrice > 1000000) {
            cashPrice = 1000000;
        }

        require(
            IERC20(cash_new).balanceOf(address(this)) >= amount,
            'CashExchange: CashExchange has no more budget'
        );

        IERC20(cash_old).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(cash_new).safeTransfer(msg.sender, amount.mul(cashPrice).div(1000000));
        _updateCashPrice();

        emit ExchangedCash(msg.sender, amount);
    }

    // CORE
    event ExchangedCash(address indexed from, uint256 amount);
}
