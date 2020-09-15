// Tokens
// deployed first
const Cash = artifacts.require('Cash')

// ============ Reward Disribution Pools ============
const poolNames = [
  'BACDAIPool',
  'BACSUSDPool',
  'BACUSDCPool',
  'BACUSDTPool',
  'BACyCRVPool',
];
const pools = poolNames.map(name => artifacts.require(name));

// ============ Main Migration ============
module.exports = async (deployer, network, accounts) => {
  await Promise.all(
    pools.map(contract => deployer.deploy(contract, Cash.address))
  );
  console.log(`Setting distributor to ${accounts[0]}`);
  await Promise.all(
    pools.map(contract => contract
      .deployed()
      .then(pool => pool.setRewardDistribution(accounts[0]))
    ),
  );
};
