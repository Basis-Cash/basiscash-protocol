// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import {IBoardroomV2} from '../boardroom/v2/Boardroom.sol';
import {BASPool, IPool} from '../distribution/v2/BASPool.sol';
import {IPoolStore, IPoolStoreGov} from '../distribution/v2/PoolStore.sol';

interface IFeeder {
    /* ================= EVENTS ================= */

    event Feeded(address indexed operator, uint256 weightA, uint256 weightB);

    /* ================= TXNS ================= */

    function feed() external;
}

contract Feeder is IFeeder, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public v1BAS;
    IERC20 public v2BAS;
    IERC20 public v2BASLP;

    address public v1BACPool;
    address public v1BASPool;
    address public v2BASPool;
    address public v2BASPoolStore;

    address public v2Boardroom;

    uint256 public v2BASPoolId;
    uint256 public v2BASLPPoolId;

    uint256 public startTime;
    uint256 public expiry;

    constructor(
        address _v1BAS,
        address _v2BAS,
        address _v2BASLP,
        address _v1BACPool,
        address _v1BASPool,
        address _v2BASPool,
        address _v2BASPoolStore,
        address _v2Boardroom,
        uint256 _startTime,
        uint256 _period
    ) Ownable() {
        // tokens
        v1BAS = IERC20(_v1BAS);
        v2BAS = IERC20(_v2BAS);
        v2BASLP = IERC20(_v2BASLP);

        // pools
        v1BACPool = _v1BACPool;
        v1BASPool = _v1BASPool;
        v2BASPool = _v2BASPool;
        v2BASPoolStore = _v2BASPoolStore;

        // boardroom
        v2Boardroom = _v2Boardroom;

        // pool id
        v2BASPoolId = IPoolStore(_v2BASPoolStore).poolIdsOf(_v2BAS)[0];
        v2BASLPPoolId = IPoolStore(_v2BASPoolStore).poolIdsOf(_v2BASLP)[0];

        // params
        startTime = _startTime;
        expiry = _startTime.add(_period);
    }

    function update(uint256 weight1, uint256 weight2) internal {
        IPoolStoreGov(v2BASPoolStore).setPool(v2BASPoolId, weight1);
        IPoolStoreGov(v2BASPoolStore).setPool(v2BASLPPoolId, weight2);

        IPool(v2BASPool).update(v2BASPoolId);
        IPool(v2BASPool).update(v2BASLPPoolId);

        IBoardroomV2(v2Boardroom).collectReward();
    }

    function feed() external override {
        require(block.timestamp >= startTime, 'Feeder: not started');
        require(block.timestamp < expiry, 'Feeder: finished');

        uint256 v1Supply =
            v1BAS.totalSupply().sub(v1BAS.balanceOf(v1BACPool)).sub(
                v1BAS.balanceOf(v1BASPool)
            );
        uint256 v2Supply = v2BAS.totalSupply();

        uint256 ratioA = v2Supply.mul(1e18).div(v1Supply); // LP
        uint256 ratioB = uint256(1e18).sub(ratioA); // Vanlia

        update(ratioB, ratioA);

        emit Feeded(msg.sender, ratioB, ratioA);
    }

    function finalize() external onlyOwner {
        require(block.timestamp >= expiry, 'Feeder: not finished');

        update(1e18, 0);
        Ownable(v2BASPoolStore).transferOwnership(_msgSender());
    }
}
