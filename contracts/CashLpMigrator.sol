pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/Math.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IOracle.sol';
import './interfaces/IBoardroom.sol';
import './owner/Operator.sol';
import './utils/ContractGuard.sol';
import './CashExchange.sol';

import './lib/UniswapV2Library.sol';
import './lib/UniswapV2OracleLibrary.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Router.sol';
import './interfaces/IUniswapV2Factory.sol';

import './interfaces/IStakingRewardsv2.sol';
import './interfaces/ICurveMeta.sol';

contract CashLpMigrator is ContractGuard {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;


    /* ========== STATE VARIABLES ========== */

    // ========== CORE

    uint256 public endTime;

    //Tokens
    address public cash_old;
    address public cash_new;
    address public lp_old;
    address public lp_new;
    address public usdt;

    //Contracts
    address public cashExchange;
    address public stakingContract;
    address public staking_new;
    address public cashOracle;
    address public univ2Router2 = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F; //the sushi router
    address public curveDepositer = 0xA79828DF1850E8a3A3064576f380D90aECDD3359; //"Zap" Depositer for permissionless USD metapools
    address public curvePool;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash_old,
        address _cash_new,
        address _usdt,
        address _lp_old,
        address _lp_new,
        address _cashOracle,
        address _stakingContract,
        address _cashExchange,
        address _curvePool,
        uint256 _endTime
    ) public {
        cash_old = _cash_old;
        cash_new = _cash_new;
        usdt = _usdt;
        lp_old = _lp_old;
        lp_new = _lp_new;
        cashOracle = _cashOracle;
        stakingContract = _stakingContract;
        cashExchange = _cashExchange;
        curvePool = _curvePool;
        endTime = _endTime;
    }

    /* ========== VIEW FUNCTIONS ========== */

    // oracle
    function getOraclePrice() public view returns (uint256) {
        return IOracle(cashOracle).consult(cash_old, 1e18);
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    function _migrateCashLP()
        internal
        onlyOneBlock
    {
        require(block.timestamp <= endTime, 'CashLpMigrator: redemption period ended');
        uint256 amount = IERC20(lp_old).balanceOf(msg.sender);
        require(amount > 0, 'CashLpMigrator: cannot exchange zero amount');

        //Transfer LPv1 to the contract
        IERC20(lp_old).safeTransferFrom(msg.sender, address(this), amount);

        //Remove liquidity, which puts USDT and MICv1 in the contract
        IERC20(lp_old).safeApprove(univ2Router2, 0);
        IERC20(lp_old).safeApprove(univ2Router2, amount);
        IUniswapV2Router(univ2Router2).removeLiquidity(
                cash_old,
                usdt,
                amount,
                0,
                0,
                address(this),
                now + 60
            );

        //Exchange balance of MICv1 for MICv2
        uint256 cash_old_amount = IERC20(cash_old).balanceOf(address(this));
        IERC20(cash_old).safeApprove(cashExchange, 0);
        IERC20(cash_old).safeApprove(cashExchange, cash_old_amount);
        CashExchange(cashExchange).exchangeCash(cash_old_amount);
        
        uint256 usdt_amount = IERC20(usdt).balanceOf(address(this));
        uint256 cash_new_amount = IERC20(cash_new).balanceOf(address(this));
            
        //Add USDT + MICv2 liquidity to Curve, which puts LPv2 in the contract
        IERC20(usdt).safeApprove(curvePool, 0);
        IERC20(usdt).safeApprove(curvePool, usdt_amount);
        IERC20(cash_new).safeApprove(curvePool, 0);
        IERC20(cash_new).safeApprove(curvePool, cash_new_amount);
        //args are: address, [cash, dai, usdc, usdt], min_mint_amount
        ICurveMeta(curveDepositer).add_liquidity(curvePool, [cash_new_amount, 0, 0, usdt_amount], 1);
    }

    //Converts V1 Cash/stable LP to V2 Cash/stable LP and transfers the V2 LP tokens back to the user
    function migrateCashLP()
        external
    {
        _migrateCashLP();
        //Transfer current balance of LP tokens back to the user
        IERC20(lp_new).safeTransfer(msg.sender, IERC20(lp_new).balanceOf(address(this)));
    }

    //Converts V1 Cash/stable LP to V2 Cash/stable LP and stakes the V2 LP tokens on behalf of the user
    function migrateLockedCashLP()
        external
        onlyOneBlock
    {
        //Only need to check price if I'm locking
        uint256 cashPrice = getOraclePrice();
        require(cashPrice <= 1000000, 'Cash v1 price must be <= $1');

        _migrateCashLP();

        //StakeLocked(_address, balance) stakes on behalf of _address
        //new staking contract should check the cash price before allowing people to stake locked
        //if that is the case, then I don't need to check the cash price in this contract
        IStakingRewardsv2(stakingContract).stakeLockedFor(msg.sender, IERC20(lp_new).balanceOf(address(this)));
    }

    // CORE
    event ExchangedCash(address indexed from, uint256 amount);
}
