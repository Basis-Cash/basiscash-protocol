const { bacPools, INITIAL_BAC_FOR_POOLS } = require('./pools');

// Pools
// deployed first
const Cash = artifacts.require('Cash')
const Share = artifacts.require('Share')
const InitialCashDistributor = artifacts.require('InitialCashDistributor');
const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

// ============ Main Migration ============

async function migration(deployer, network, accounts) {
  const unit = web3.utils.toBN(10 ** 18);

  const cash = await Cash.deployed();
  const period = network === 'mainnet'
    ? 86400  // distributed throughout 5 days on mainnet
    : 1;     // fast-rewind on testnet

  await deployer.deploy(
    InitialCashDistributor,
    cash.address,
    bacPools.map(({ contract }) => contract.address),
    unit.muln(INITIAL_BAC_FOR_POOLS).toString(),
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

  await cash.mint(distributor.address, unit.muln(INITIAL_BAC_FOR_POOLS).toString());
  console.log(`Deposited ${INITIAL_BAC_FOR_POOLS} BAC to InitialCashDistributor.`);

  if (network !== 'mainnet') {
    // unit period is set as a second on testnet,
    // so calling performDailyDistribution() will distribute entire balance instantly
    console.log('Distributing initial Basis Cash instantly for test...');
    await distributor.performDailyDistribution();
  } else {
    console.log('NOTES ON MAINNET LAUNCH:')
    console.log(`  You need to call performDailyDistribution() once a day for distribution to BAC pools.`);
  }
  console.log('=================================');

  console.log('Distributing initial Basis Share');
  const share = await Share.deployed();
  await Promise.all([
    share.mint(DAIBACLPToken_BASPool.address, unit.muln(750000).toString()),
    share.mint(DAIBASLPToken_BASPool.address, unit.muln(250000).toString()),
  ]);

  const daibaclptoken_baspool = await DAIBACLPToken_BASPool.deployed();
  const daibaslptoken_baspool = await DAIBASLPToken_BASPool.deployed();

  await Promise.all([
    daibaclptoken_baspool.notifyRewardAmount(unit.muln(750000).toString()),
    daibaslptoken_baspool.notifyRewardAmount(unit.muln(250000).toString()),
  ]);
}

module.exports = migration;
