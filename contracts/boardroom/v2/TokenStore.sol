// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {Operator} from '../../access/Operator.sol';

interface ITokenStore {
    /* ================= EVENTS ================= */

    event Deposit(
        address indexed operator,
        address indexed owner,
        uint256 amount
    );
    event Withdraw(
        address indexed operator,
        address indexed owner,
        uint256 amount
    );

    /* ================= CALLS ================= */

    function token() external view returns (address);

    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256);

    /* ================= TXNS ================= */

    function deposit(address _owner, uint256 _amount) external;

    function withdraw(address _owner, uint256 _amount) external;

    function emergencyWithdraw() external;
}

interface ITokenStoreGov {
    /* ================= EVENTS ================= */

    event EmergencyReported(address indexed reporter);
    event EmergencyResolved(address indexed resolver);

    event TokenChanged(
        address indexed owner,
        address newToken,
        address oldToken
    );

    /* ================= TXNS ================= */

    function reportEmergency() external;

    function resolveEmergency() external;

    function setToken(address newToken) external;
}

contract TokenStore is ITokenStore, ITokenStoreGov, Operator {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ================= STATES ================= */

    address public override token;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    bool public emergency = false;

    constructor(address _token) Operator() {
        token = _token;
    }

    /* ================= GOV - OWNER ONLY ================= */

    /**
     * @dev CAUTION: DO NOT USE IN NORMAL SITUATION
     * @notice Enable emergency withdraw
     */
    function reportEmergency() public override onlyOwner {
        emergency = true;
        emit EmergencyReported(_msgSender());
    }

    /**
     * @dev CAUTION: DO NOT USE IN NORMAL SITUATION
     * @notice Disable emergency withdraw
     */
    function resolveEmergency() public override onlyOwner {
        emergency = false;
        emit EmergencyResolved(_msgSender());
    }

    /**
     * @dev CAUTION: MUST USE 1:1 TOKEN MIGRATION
     */
    function setToken(address newToken) public override onlyOwner {
        address oldToken = token;
        token = newToken;
        IERC20(newToken).safeTransferFrom(
            msg.sender,
            address(this),
            totalSupply()
        );
        emit TokenChanged(_msgSender(), newToken, oldToken);
    }

    /* ================= CALLS - ANYONE ================= */

    /**
     * @return total staked token amount
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @param _owner staker address
     * @return staked amount of user
     */
    function balanceOf(address _owner) public view override returns (uint256) {
        return _balances[_owner];
    }

    /* ================= TXNS - OPERATOR ONLY ================= */

    /**
     * @param _owner stake address
     * @param _amount stake amount
     */
    function deposit(address _owner, uint256 _amount)
        public
        override
        onlyOperator
    {
        _totalSupply = _totalSupply.add(_amount);
        _balances[_owner] = _balances[_owner].add(_amount);
        IERC20(token).safeTransferFrom(_msgSender(), address(this), _amount);

        emit Deposit(_msgSender(), _owner, _amount);
    }

    /**
     * @param _owner stake address
     * @param _amount stake amount
     */
    function withdraw(address _owner, uint256 _amount)
        public
        override
        onlyOperator
    {
        _totalSupply = _totalSupply.sub(_amount);
        _balances[_owner] = _balances[_owner].sub(_amount);
        IERC20(token).safeTransfer(_msgSender(), _amount);

        emit Withdraw(_msgSender(), _owner, _amount);
    }

    /**
     * @notice Anyone can withdraw its balance even if is not the operator
     */
    function emergencyWithdraw() public override {
        require(emergency, 'TokenStore: not in emergency');

        uint256 balance = _balances[_msgSender()];
        _balances[_msgSender()] = 0;
        IERC20(token).safeTransfer(_msgSender(), balance);

        emit Withdraw(_msgSender(), _msgSender(), balance);
    }
}
