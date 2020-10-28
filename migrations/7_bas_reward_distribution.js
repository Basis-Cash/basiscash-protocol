const {
  lpPoolDAIBAC,
  lpPoolDAIBAS,
  INITIAL_BAS_FOR_DAI_BAC,
  INITIAL_BAS_FOR_DAI_BAS,
  STARTING_AMOUNT_FOR_DAI_BAS,
} = require('./pools');

// Pools
// deployed first
const Share = artifacts.require('Share');
const InitialShareDistributor = artifacts.require('InitialShareDistributor');

// ============ Main Migration ============

async function migration(deployer, network, accounts) {
  const unit = web3.utils.toBN(10 ** 18);
  const totalBalanceForDAIBAC = unit.muln(INITIAL_BAS_FOR_DAI_BAC).toString();
  const totalBalanceForDAIBAS = unit.muln(INITIAL_BAS_FOR_DAI_BAS).toString();
  const startingAmountForDAIBAS = unit.muln(STARTING_AMOUNT_FOR_DAI_BAS).toString();

  const share = await Share.deployed();
  const period = network === 'mainnet'
    ? 86400  // distributed throughout 5 days on mainnet
    : 1;     // fast-rewind on testnet

  const deflation = {
    rate: network === 'mainnet' ? 75 : 50,
    interval: network === 'mainnet' ? 30 : 1,
  }

  await deployer.deploy(
    InitialShareDistributor,
    share.address,
    lpPoolDAIBAC.contract.address,
    lpPoolDAIBAS.contract.address,
    totalBalanceForDAIBAC,
    totalBalanceForDAIBAS,
    startingAmountForDAIBAS,
    deflation.rate,
    deflation.interval,
    period,
  );
  const distributor = await InitialShareDistributor.deployed();

  console.log(`Setting distributor to InitialShareDistributor (${distributor.address})`);
  await Promise.all(
    [lpPoolDAIBAC, lpPoolDAIBAS].map(({ contract }) => contract
      .deployed()
      .then(pool => pool.setRewardDistribution(distributor.address))
    ),
  );

  await share.mint(distributor.address, INITIAL_BAS_FOR_DAI_BAC);
  await share.mint(distributor.address, INITIAL_BAS_FOR_DAI_BAS);
  console.log(`Deposited ${INITIAL_BAS_FOR_DAI_BAC + INITIAL_BAS_FOR_DAI_BAS} BAS to InitialShareDistributor.`);

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

module.exports = migration;
