// Pools
// deployed first
const Cash = artifacts.require('Cash')
const Bond = artifacts.require('Bond')
const Share = artifacts.require('Share')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    setTestBalances(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ])
}

module.exports = migration

// ============ Deploy Functions ============

async function setTestBalances(deployer, network, accounts) {
  if (network !== 'mainnet') {
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
