const { bacPools, INITIAL_BAC_FOR_POOLS } = require('./pools');

// Pools
// deployed first
const Cash = artifacts.require('Cash')
const InitialCashDistributor = artifacts.require('InitialCashDistributor');

// ============ Main Migration ============

module.exports = async (deployer, network, accounts) => {
  const unit = web3.utils.toBN(10 ** 18);
  const initialCashAmount = unit.muln(INITIAL_BAC_FOR_POOLS).toString();

  const cash = await Cash.deployed();
  const period = network === 'mainnet'
    ? 86400  // distributed throughout 5 days on mainnet
    : 1;     // fast-rewind on testnet

  const pools = bacPools.map(({contractName}) => artifacts.require(contractName));

  await deployer.deploy(
    InitialCashDistributor,
    cash.address,
    pools.map(p => p.address),
    initialCashAmount,
  );
  const distributor = await InitialCashDistributor.deployed();

  console.log(`Setting distributor to InitialCashDistributor (${distributor.address})`);
  await Promise.all(
    pools.map(pool => pool
      .deployed()
      .then(p => p.setRewardDistribution(distributor.address))
    ),
  );

  await cash.mint(distributor.address, initialCashAmount);
  console.log(`Deposited ${INITIAL_BAC_FOR_POOLS} BAC to InitialCashDistributor.`);

  await distributor.distribute();
}
