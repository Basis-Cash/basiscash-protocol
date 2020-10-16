// ============ Contracts ============

// Token
// deployed first
const Cash = artifacts.require('Cash')
const Bond = artifacts.require('Bond')
const Share = artifacts.require('Share')
const MockDai = artifacts.require('MockDai');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  await deployer.deploy(Cash);
  await deployer.deploy(Bond);
  await deployer.deploy(Share);

  if (network !== 'mainnet') {
    await deployer.deploy(MockDai);

    // mint test balance
    const cash = await Cash.deployed();
    const bond = await Bond.deployed();
    const share = await Share.deployed();

    const fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))

    await Promise.all([
      cash.mint(accounts[0], fifty_thousand.toString(), { from: accounts[0] }),
      bond.mint(accounts[0], fifty_thousand.toString(), { from: accounts[0] }),
      share.mint(accounts[0], fifty_thousand.toString(), { from: accounts[0] }),
    ]);
  }
}
