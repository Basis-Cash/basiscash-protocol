// Pools
// deployed first
const Cash = artifacts.require('Cash')
const BAC_DAIPool = artifacts.require('BACDAIPool')
const BAC_SUSDPool = artifacts.require('BACSUSDPool')
const BAC_USDCPool = artifacts.require('BACUSDCPool')
const BAC_USDTPool = artifacts.require('BACUSDTPool')
const BAC_YFIPool = artifacts.require('BACYFIPool')

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
  let dai_pool = new web3.eth.Contract(BAC_DAIPool.abi, BAC_DAIPool.address)
  let susd_pool = new web3.eth.Contract(BAC_SUSDPool.abi, BAC_SUSDPool.address)
  let usdc_pool = new web3.eth.Contract(BAC_USDCPool.abi, BAC_USDCPool.address)
  let usdt_pool = new web3.eth.Contract(BAC_USDTPool.abi, BAC_USDTPool.address)
  let yfi_pool = new web3.eth.Contract(BAC_YFIPool.abi, BAC_YFIPool.address)

  // TODO: Set up token amount to send for each pool in the first day
  let fifty_thousand = web3.utils
    .toBN(5 * 10 ** 4)
    .mul(web3.utils.toBN(10 ** 18))

  console.log('transfering and notifying')
  console.log('basis cash')
  let cash = new web3.eth.Contract(Cash.abi, Cash.address)

  await Promise.all([
    dai_pool.methods
      .notifyRewardAmount(fifty_thousand.toString())
      .send({ from: accounts[0] }),
    susd_pool.methods
      .notifyRewardAmount(fifty_thousand.toString())
      .send({ from: accounts[0] }),
    usdc_pool.methods
      .notifyRewardAmount(fifty_thousand.toString())
      .send({ from: accounts[0] }),
    usdt_pool.methods
      .notifyRewardAmount(fifty_thousand.toString())
      .send({ from: accounts[0] }),
    yfi_pool.methods
      .notifyRewardAmount(fifty_thousand.toString())
      .send({ from: accounts[0] }),
  ])

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
      .mint(BAC_YFIPool.address, fifty_thousand.toString())
      .send({ from: accounts[0] }),
  ])
}
