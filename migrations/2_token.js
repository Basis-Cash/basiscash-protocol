// ============ Contracts ============

// Token
// deployed first
const Cash = artifacts.require('Cash')
const Bond = artifacts.require('Bond')
const Share = artifacts.require('Share')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network) {
  await deployer.deploy(Cash)
  await deployer.deploy(Bond)
  await deployer.deploy(Share)
  let cash = new web3.eth.Contract(Cash.abi, Cash.address)
  await cash.methods
    .mint(accounts[0], fifty_thousand.mul(web3.utils.toBN(5)).toString())
    .call()
}
