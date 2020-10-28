pragma solidity ^0.6.0;

import './interfaces/IDistributor.sol';

contract Distributor {

  IDistributor[] public distributors;

  constructor(IDistributor[] memory _distributors) public {
    distributors = _distributors;
  }

  function distribute() public {
    for (uint i = 0; i < distributors.length; i++) {
      distributors[i].performDailyDistribution();
    }
  }
}
