// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {Operator} from '../../access/Operator.sol';

interface IPoolStore {
    /* ================= EVENTS ================= */
    event Deposit(
        address indexed operator,
        address indexed owner,
        uint256 indexed pid,
        uint256 amount
    );
    event Withdraw(
        address indexed operator,
        address indexed owner,
        uint256 indexed pid,
        uint256 amount
    );

    /* ================= CALLS ================= */

    // common
    function totalWeight() external view returns (uint256);

    function poolLength() external view returns (uint256);

    // index
    function poolIdsOf(address _token) external view returns (uint256[] memory);

    // pool info
    function nameOf(uint256 _pid) external view returns (string memory);

    function tokenOf(uint256 _pid) external view returns (address);

    function weightOf(uint256 _pid) external view returns (uint256);

    function totalSupply(uint256 _pid) external view returns (uint256);

    function balanceOf(uint256 _pid, address _owner)
        external
        view
        returns (uint256);

    /* ================= TXNS ================= */

    function deposit(
        uint256 _pid,
        address _owner,
        uint256 _amount
    ) external;

    function withdraw(
        uint256 _pid,
        address _owner,
        uint256 _amount
    ) external;

    function emergencyWithdraw(uint256 _pid) external;
}

interface IPoolStoreGov {
    /* ================= EVENTS ================= */

    event EmergencyReported(address indexed reporter);
    event EmergencyResolved(address indexed resolver);

    event PoolAdded(
        address indexed operator,
        uint256 indexed pid,
        string name,
        address token,
        uint256 weight
    );
    event PoolWeightChanged(
        address indexed operator,
        uint256 indexed pid,
        uint256 from,
        uint256 to
    );
    event PoolNameChanged(
        address indexed operator,
        uint256 indexed pid,
        string from,
        string to
    );

    /* ================= TXNS ================= */

    // emergency
    function reportEmergency() external;

    function resolveEmergency() external;

    // pool setting
    function addPool(
        string memory _name,
        IERC20 _token,
        uint256 _weight
    ) external;

    function setPool(uint256 _pid, uint256 _weight) external;

    function setPool(uint256 _pid, string memory _name) external;
}

contract PoolStore is IPoolStore, IPoolStoreGov, Operator {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ================= DATA STRUCTURE ================= */

    struct Pool {
        string name;
        IERC20 token;
        uint256 weight;
        uint256 totalSupply;
    }

    /* ================= STATES ================= */

    uint256 public override totalWeight = 0;

    Pool[] public pools;
    mapping(uint256 => mapping(address => uint256)) balances;
    mapping(address => uint256[]) public indexByToken;

    bool public emergency = false;

    constructor() Operator() {}

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
     * @param _token pool token
     * @param _weight pool weight
     */
    function addPool(
        string memory _name,
        IERC20 _token,
        uint256 _weight
    ) public override onlyOwner {
        totalWeight = totalWeight.add(_weight);

        uint256 index = pools.length;
        indexByToken[address(_token)].push(index);

        pools.push(
            Pool({name: _name, token: _token, weight: _weight, totalSupply: 0})
        );
        emit PoolAdded(_msgSender(), index, _name, address(_token), _weight);
    }

    /**
     * @param _pid pool id
     * @param _weight target pool weight
     */
    function setPool(uint256 _pid, uint256 _weight)
        public
        override
        checkPoolId(_pid)
        onlyOwner
    {
        Pool memory pool = pools[_pid];

        uint256 oldWeight = pool.weight;
        totalWeight = totalWeight.add(_weight).sub(pool.weight);
        pool.weight = _weight;

        pools[_pid] = pool;

        emit PoolWeightChanged(_msgSender(), _pid, oldWeight, _weight);
    }

    /**
     * @param _pid pool id
     * @param _name name of pool
     */
    function setPool(uint256 _pid, string memory _name)
        public
        override
        checkPoolId(_pid)
        onlyOwner
    {
        string memory oldName = pools[_pid].name;
        pools[_pid].name = _name;

        emit PoolNameChanged(_msgSender(), _pid, oldName, _name);
    }

    /* ================= MODIFIER ================= */

    modifier checkPoolId(uint256 _pid) {
        require(_pid <= pools.length, 'PoolStore: invalid pid');

        _;
    }

    /* ================= CALLS - ANYONE ================= */
    /**
     * @return total pool length
     */
    function poolLength() public view override returns (uint256) {
        return pools.length;
    }

    /**
     * @param _token pool token address
     * @return pool id
     */
    function poolIdsOf(address _token)
        public
        view
        override
        returns (uint256[] memory)
    {
        return indexByToken[_token];
    }

    /**
     * @param _pid pool id
     * @return name of pool
     */
    function nameOf(uint256 _pid)
        public
        view
        override
        checkPoolId(_pid)
        returns (string memory)
    {
        return pools[_pid].name;
    }

    /**
     * @param _pid pool id
     * @return pool token
     */
    function tokenOf(uint256 _pid)
        public
        view
        override
        checkPoolId(_pid)
        returns (address)
    {
        return address(pools[_pid].token);
    }

    /**
     * @param _pid pool id
     * @return pool weight
     */
    function weightOf(uint256 _pid)
        public
        view
        override
        checkPoolId(_pid)
        returns (uint256)
    {
        return pools[_pid].weight;
    }

    /**
     * @param _pid pool id
     * @return total staked token amount
     */
    function totalSupply(uint256 _pid)
        public
        view
        override
        checkPoolId(_pid)
        returns (uint256)
    {
        return pools[_pid].totalSupply;
    }

    /**
     * @param _pid pool id
     * @param _sender staker address
     * @return staked amount of user
     */
    function balanceOf(uint256 _pid, address _sender)
        public
        view
        override
        checkPoolId(_pid)
        returns (uint256)
    {
        return balances[_pid][_sender];
    }

    /* ================= TXNS - OPERATOR ONLY ================= */

    /**
     * @param _pid pool id
     * @param _owner stake address
     * @param _amount stake amount
     */
    function deposit(
        uint256 _pid,
        address _owner,
        uint256 _amount
    ) public override checkPoolId(_pid) onlyOperator {
        pools[_pid].totalSupply = pools[_pid].totalSupply.add(_amount);
        balances[_pid][_owner] = balances[_pid][_owner].add(_amount);
        IERC20(tokenOf(_pid)).safeTransferFrom(
            _msgSender(),
            address(this),
            _amount
        );

        emit Deposit(_msgSender(), _owner, _pid, _amount);
    }

    function _withdraw(
        uint256 _pid,
        address _owner,
        uint256 _amount
    ) internal {
        pools[_pid].totalSupply = pools[_pid].totalSupply.sub(_amount);
        balances[_pid][_owner] = balances[_pid][_owner].sub(_amount);
        IERC20(tokenOf(_pid)).safeTransfer(_msgSender(), _amount);

        emit Withdraw(_msgSender(), _owner, _pid, _amount);
    }

    /**
     * @param _pid pool id
     * @param _owner stake address
     * @param _amount stake amount
     */
    function withdraw(
        uint256 _pid,
        address _owner,
        uint256 _amount
    ) public override checkPoolId(_pid) onlyOperator {
        _withdraw(_pid, _owner, _amount);
    }

    /**
     * @notice Anyone can withdraw its balance even if is not the operator
     * @param _pid pool id
     */
    function emergencyWithdraw(uint256 _pid) public override checkPoolId(_pid) {
        require(emergency, 'PoolStore: not in emergency');
        _withdraw(_pid, msg.sender, balanceOf(_pid, _msgSender()));
    }
}
