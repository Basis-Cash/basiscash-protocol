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
    let cash = new web3.eth.Contract(Cash.abi, Cash.address)
    let bond = new web3.eth.Contract(Bond.abi, Bond.address)
    let share = new web3.eth.Contract(Share.abi, Share.address)

    let fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))

    await Promise.all([
      cash.methods
        .mint(accounts[0], fifty_thousand.toString())
        .send({ from: accounts[0] }),
      bond.methods
        .mint(accounts[0], fifty_thousand.toString())
        .send({ from: accounts[0] }),
      share.methods
        .mint(accounts[0], fifty_thousand.toString())
        .send({ from: accounts[0] }),
    ])
  }
}
