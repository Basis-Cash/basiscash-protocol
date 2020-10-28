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

  await deployer.deploy(
    InitialCashDistributor,
    cash.address,
    bacPools.map(({ contract }) => contract.address),
    initialCashAmount,
    period,
  );
  const distributor = await InitialCashDistributor.deployed();

  console.log(`Setting distributor to InitialCashDistributor (${distributor.address})`);
  await Promise.all(
    bacPools.map(({ contract }) => contract
      .deployed()
      .then(pool => pool.setRewardDistribution(distributor.address))
    ),
  );

  await cash.mint(distributor.address, initialCashAmount);
  console.log(`Deposited ${INITIAL_BAC_FOR_POOLS} BAC to InitialCashDistributor.`);

  if (network !== 'mainnet') {
    // unit period is set as a second on testnet,
    // so calling performDailyDistribution() will distribute entire balance instantly
    console.log('Distributing initial Basis Cash instantly for test...');
    await distributor.performDailyDistribution();
  } else {
    console.log('NOTES ON MAINNET LAUNCH:')
    console.log(`  performDailyDistribution() should be called at most once a day for distribution to BAC pools.`);
  }
  console.log('=================================');
}
