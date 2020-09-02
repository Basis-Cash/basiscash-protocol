// Tokens
// deployed first
const Cash = artifacts.require('Cash')
const Share = artifacts.require('Share')

// Liquidity providers
// deployed second
const Oracle = artifacts.require('Oracle')
const MockOracle = artifacts.require('MockOracle')

// ============ Reward Disribution Pools ============

const BAC_DAIPool = artifacts.require('BACDAIPool')
const BAC_SUSDPool = artifacts.require('BACSUSDPool')
const BAC_USDCPool = artifacts.require('BACUSDCPool')
const BAC_USDTPool = artifacts.require('BACUSDTPool')
const BAC_YFIPool = artifacts.require('BACYFIPool')
const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  if (network != 'test') {
    console.log('notifying')
    console.log('basis cash')
    const dai_pool = new web3.eth.Contract(BAC_DAIPool.abi, BAC_DAIPool.address)
    const susd_pool = new web3.eth.Contract(
      BAC_SUSDPool.abi,
      BAC_SUSDPool.address,
    )
    const usdc_pool = new web3.eth.Contract(
      BAC_USDCPool.abi,
      BAC_USDCPool.address,
    )
    const usdt_pool = new web3.eth.Contract(
      BAC_USDTPool.abi,
      BAC_USDTPool.address,
    )
    const yfi_pool = new web3.eth.Contract(BAC_YFIPool.abi, BAC_YFIPool.address)

    const daibaclptoken_baspool = new web3.eth.Contract(
      DAIBACLPToken_BASPool.abi,
      DAIBACLPToken_BASPool.address,
    )
    const daibaslptoken_baspool = new web3.eth.Contract(
      DAIBASLPToken_BASPool.abi,
      DAIBASLPToken_BASPool.address,
    )

    let fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))

    await Promise.all([
      dai_pool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
      susd_pool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
      usdc_pool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
      usdt_pool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
      yfi_pool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
      daibaclptoken_baspool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
      daibaslptoken_baspool.methods
        .notifyRewardAmount(fifty_thousand.toString())
        .send({ from: accounts[0], gas: 100000 }),
    ])
  }
}
