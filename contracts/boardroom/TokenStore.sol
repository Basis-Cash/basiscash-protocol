pragma solidity ^0.6.0;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {Operator} from '../owner/Operator.sol';

interface ITokenStore {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;
}

contract TokenStore is ITokenStore, Operator {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== EVENTS ========== */

    event TokenChanged(
        address indexed operator,
        address oldToken,
        address newToken
    );

    /* ========== STATE VARIABLES ========== */

    address public token;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _token) public {
        token = _token;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    // gov
    function setToken(address newToken) public onlyOwner {
        address oldToken = token;
        token = newToken;
        emit TokenChanged(msg.sender, oldToken, newToken);
    }

    // logic
    function deposit(uint256 amount) public override {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public override {
        uint256 balance = _balances[msg.sender];
        require(
            balance >= amount,
            'TokenStore: withdraw request greater than staked amount'
        );
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = balance.sub(amount);
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}

abstract contract TokenStoreProxy is ITokenStore {
    /* ========== EVENTS ========== */

    event TokenStoreChanged(
        address indexed operator,
        address oldTokenStore,
        address newTokenStore
    );

    /* ========== STATE VARIABLES ========== */

    address public tokenStore;

    /* ========== VIEW FUNCTIONS ========== */

    function totalSupply() public view override returns (uint256) {
        return TokenStore(tokenStore).totalSupply();
    }

    function balanceOf(address account) public view override returns (uint256) {
        return TokenStore(tokenStore).balanceOf(account);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    // gov
    function setTokenStore(address newTokenStore) public virtual {
        address oldTokenStore = tokenStore;
        tokenStore = newTokenStore;
        emit TokenStoreChanged(msg.sender, oldTokenStore, newTokenStore);
    }

    // logic
    function deposit(uint256 amount) public virtual override {
        (bool success, bytes memory reason) =
            tokenStore.delegatecall(
                abi.encodeWithSignature('deposit(uint256)', amount)
            );
        require(success, string(reason));
    }

    function withdraw(uint256 amount) public virtual override {
        (bool success, bytes memory reason) =
            tokenStore.delegatecall(
                abi.encodeWithSignature('withdraw(uint256)', amount)
            );
        require(success, string(reason));
    }
}
