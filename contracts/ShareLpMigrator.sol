pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './owner/Operator.sol';
import './utils/ContractGuard.sol';
import './ShareExchange.sol';

import './lib/UniswapV2Library.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Router.sol';
import './interfaces/IUniswapV2Factory.sol';

contract ShareLpMigrator is ContractGuard {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;


    /* ========== STATE VARIABLES ========== */

    // ========== CORE

    uint256 public endTime;

    //Tokens
    address public share_old;
    address public share_new;
    address public lp_old;
    address public lp_new;
    address public usdt;

    //Contracts
    address public shareExchange;
    address public univ2Router2 = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F; //the sushi router

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _share_old,
        address _share_new,
        address _usdt,
        address _lp_old,
        address _lp_new,
        address _shareExchange,
        uint256 _endTime
    ) public {
        share_old = _share_old;
        share_new = _share_new;
        usdt = _usdt;
        lp_old = _lp_old;
        lp_new = _lp_new;
        shareExchange = _shareExchange;
        endTime = _endTime;
    }

    /* ========== VIEW FUNCTIONS ========== */

    /* ========== MUTABLE FUNCTIONS ========== */

    function _migrateShareLP()
        internal
        onlyOneBlock
    {
        require(block.timestamp <= endTime, 'ShareLpMigrator: redemption period ended');
        uint256 amount = IERC20(lp_old).balanceOf(msg.sender);
        require(amount > 0, 'ShareLpMigrator: cannot exchange zero amount');

        //Transfer LPv1 to the contract
        IERC20(lp_old).safeTransferFrom(msg.sender, address(this), amount);

        //Remove liquidity, which puts USDT and MICv1 in the contract
        IERC20(lp_old).safeApprove(univ2Router2, 0);
        IERC20(lp_old).safeApprove(univ2Router2, amount);
        IUniswapV2Router(univ2Router2).removeLiquidity(
                share_old,
                usdt,
                amount,
                0,
                0,
                address(this),
                now + 60
            );

        //Exchange balance of MISv1 for MISv2
        uint256 share_old_amount = IERC20(share_old).balanceOf(address(this));
        IERC20(share_old).safeApprove(shareExchange, 0);
        IERC20(share_old).safeApprove(shareExchange, share_old_amount);
        ShareExchange(shareExchange).exchangeShares(share_old_amount);
        
        uint256 usdt_amount = IERC20(usdt).balanceOf(address(this));
        uint256 share_new_amount = IERC20(share_new).balanceOf(address(this));

        //Add USDT + MISv2 liquidity to Sushiswap, which puts LPv2 in the contract
        IERC20(usdt).safeApprove(univ2Router2, 0);
        IERC20(usdt).safeApprove(univ2Router2, usdt_amount);
        IERC20(share_new).safeApprove(univ2Router2, 0);
        IERC20(share_new).safeApprove(univ2Router2, share_new_amount);
        IUniswapV2Router(univ2Router2).addLiquidity(
                usdt,
                share_new,
                usdt_amount,
                share_new_amount,
                0,
                0,
                address(this),
                now + 60
            );
            
        //Transfer any remaining MISv2/USDT back to the user
        usdt_amount = IERC20(usdt).balanceOf(address(this));
        share_new_amount = IERC20(share_new).balanceOf(address(this));
        if(usdt_amount > 0) {
            IERC20(usdt).safeTransfer(msg.sender, usdt_amount);
        }
        if(share_new_amount > 0) {
            IERC20(share_new).safeTransfer(msg.sender, share_new_amount);
        }
    }

    //Converts V1 Share/stable LP to V2 Share/stable LP and transfers the V2 LP tokens back to the user
    function migrateShareLP()
        external
    {
        _migrateShareLP();
        //Transfer current balance of LP tokens back to the user
        IERC20(lp_new).safeTransfer(msg.sender, IERC20(lp_new).balanceOf(address(this)));
    }
}
