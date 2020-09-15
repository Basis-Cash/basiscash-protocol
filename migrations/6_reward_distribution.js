// Pools
// deployed first
const Cash = artifacts.require('Cash')
const BAC_DAIPool = artifacts.require('BACDAIPool')
const BAC_SUSDPool = artifacts.require('BACSUSDPool')
const BAC_USDCPool = artifacts.require('BACUSDCPool')
const BAC_USDTPool = artifacts.require('BACUSDTPool')
const BAC_yCRVPool = artifacts.require('BACyCRVPool')
const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployRewardDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployRewardDistribution(deployer, network, accounts) {
  console.log('depositing')
  console.log('basis cash')
  let cash = new web3.eth.Contract(Cash.abi, Cash.address)

  let fifty_thousand = web3.utils
    .toBN(5 * 10 ** 4)
    .mul(web3.utils.toBN(10 ** 18))

  await Promise.all([
    cash.methods
      .mint(BAC_DAIPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_SUSDPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_USDCPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_USDTPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_yCRVPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
    cash.methods
      .mint(DAIBACLPToken_BASPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
    cash.methods
      .mint(DAIBASLPToken_BASPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
  ])
}
