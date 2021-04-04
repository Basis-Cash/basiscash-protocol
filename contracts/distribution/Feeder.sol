// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

import {IPoolStore, IPoolStoreGov} from './PoolStore.sol';
import {Operator} from '../access/Operator.sol';
import {IOracle} from '../oracle/Oracle.sol';
import {ICurve} from '../curve/Curve.sol';

contract Feeder is Operator {
    using SafeMath for uint256;

    enum FeedStatus {Neutral, BelowPeg, AbovePeg}

    uint256 public constant ETH = 1e18;

    // gov
    address public token;
    address public target;
    address public curve;
    address public oracle;

    function setToken(address _newToken) public onlyOwner {
        token = _newToken;
    }

    function setTarget(address _newTarget) public onlyOwner {
        target = _newTarget;
    }

    function setCurve(address _newCurve) public onlyOwner {
        curve = _newCurve;
    }

    function setOracle(address _newOracle) public onlyOwner {
        oracle = _newOracle;
    }

    // pools
    uint256 cashLP;
    uint256 cashVault;
    uint256 shareLP;
    uint256 boardroom;
    uint256 bondroom;
    uint256 strategicPair;
    uint256 communityFund;

    FeedStatus lastUpdated = FeedStatus.Neutral;

    function feed() public onlyOperator {
        uint256 price = IOracle(oracle).consult(token, ETH);
        uint256 rate = ICurve(curve).calcCeiling(price);

        // 60 * 1e18
        IPoolStoreGov(target).setPool(cashLP, ETH.sub(rate).mul(60));
        IPoolStoreGov(target).setPool(cashVault, rate.mul(60));
        if (IPoolStore(target).weightOf(shareLP) != ETH.mul(10)) {
            IPoolStoreGov(target).setPool(shareLP, ETH.mul(10));
        }

        // below peg
        if (lastUpdated != FeedStatus.BelowPeg && price < ETH) {
            /*
                15% BAS Boardroom stakers
                5% BAB staking pool
                5% Strategic Pairs
                5% CDF/Vision Fund
            */
            IPoolStoreGov(target).setPool(boardroom, ETH.mul(15));
            IPoolStoreGov(target).setPool(bondroom, ETH.mul(5));
            IPoolStoreGov(target).setPool(strategicPair, ETH.mul(5));
            IPoolStoreGov(target).setPool(communityFund, ETH.mul(5));

            lastUpdated = FeedStatus.BelowPeg;
        }

        // above peg
        if (lastUpdated != FeedStatus.AbovePeg && price >= ETH) {
            /*
                5% BAS boardroom stakers
                10% Strategic Pairs
                15% the CDF/Vision
            */
            IPoolStoreGov(target).setPool(boardroom, ETH.mul(5));
            IPoolStoreGov(target).setPool(strategicPair, ETH.mul(10));
            IPoolStoreGov(target).setPool(communityFund, ETH.mul(15));

            lastUpdated = FeedStatus.AbovePeg;
        }
    }
}
