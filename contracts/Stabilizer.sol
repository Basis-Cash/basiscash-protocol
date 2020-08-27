pragma solidity ^0.5.0;

import './token/ERC20.sol';
import './owner/Ownable.sol';
import './lib/Safe112.sol';
import './interfaces/IBasisAsset.sol';
import './interfaces/IBasisBank.sol';
import './interfaces/IOracle.sol';
import './interfaces/IBondRedemptionPool.sol';
import './guards/ReentrancyGuard.sol';

contract Stabilizer is ReentrancyGuard, Ownable, IBasisAsset, IBasisBank, IOracle {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    address public basisCash;
    address public basisBank;
    address public oracle;
    address public multidai;
    address private bondRedemptionPool;
    address private seigniorageSharePool;

    uint256 private upCliff;
    uint256 private lastStabilized;
    uint256 private one = 1e18;

    struct BondOrder {
        address orderer;
        uint256 amount;
    }

    modifier readyToStabilize {
        require(now.sub(lastStabilized) >= 1 days, "ReadyToStabilize: a day has not passed yet");
        _;
    }
    
    constructor(address cash_, address bank_, address bondPool_, address sharePool_, address oracle_, address multidai_) payable public {
        basisCash = cash_;
        basisBank = bank_;
        bondRedemptionPool = bondPool_;
        seigniorageSharePool = sharePool_;
        oracle = oracle_;
        multidai = multidai_;
        lastStabilized = now;
        upCliff = one.add(one.div(100).mul(5));
    }
    
    function stabilize() public readyToStabilize {

        // get input price from 1 multidai to basis cash
        uint basisPrice = IOracle(oracle).consult(multidai, one);
        
        // if basisPrice > 1 + epsilion, then mint basis cash
        if(basisPrice > upCliff) {

            uint256 cashSupply = IERC20(basisCash).totalSupply();
            uint256 seigniorage = cashSupply.mul(basisPrice.sub(one));
            uint256 redemptionPoolBalance = IBondRedemptionPool(seigniorageSharePool).balance();
            
            if (redemptionPoolBalance > 0) {
                IBasisAsset(basisCash).mint(seigniorageSharePool, seigniorage);
                emit Stabilize(now, seigniorage, seigniorageSharePool);
            } else {
                IBasisAsset(basisCash).mint(bondRedemptionPool, seigniorage);
                emit Stabilize(now, seigniorage, bondRedemptionPool);
            }
        } 

        // reinitialize lastStabilized
        lastStabilized = now;        
    }
    
    event Stabilize(uint256 timestamp, uint256 seigniorage, address where);
}
