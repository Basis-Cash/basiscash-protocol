// Pools
// deployed first
const Cash = artifacts.require('Cash')
const Share = artifacts.require('Share')
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
  let share = new web3.eth.Contract(Share.abi, Share.address)

  await Promise.all([
    cash.methods
      .mint(BAC_DAIPool.address, "0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_SUSDPool.address, "0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_USDCPool.address, "0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_USDTPool.address, "0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
    cash.methods
      .mint(BAC_yCRVPool.address, "0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
    share.methods
      .mint(DAIBACLPToken_BASPool.address, "0x" + (25 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
    share.methods
      .mint(DAIBASLPToken_BASPool.address, "0x" + (75 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0] }),
  ])
}
