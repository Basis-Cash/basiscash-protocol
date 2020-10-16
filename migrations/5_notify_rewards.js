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
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployDistribution(deployer, network, accounts) {
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
  const yfi_pool = new web3.eth.Contract(BAC_yCRVPool.abi, BAC_yCRVPool.address)

  const daibaclptoken_baspool = new web3.eth.Contract(
    DAIBACLPToken_BASPool.abi,
    DAIBACLPToken_BASPool.address,
  )
  const daibaslptoken_baspool = new web3.eth.Contract(
    DAIBASLPToken_BASPool.abi,
    DAIBASLPToken_BASPool.address,
  );

  await Promise.all([
    dai_pool.methods
      .notifyRewardAmount("0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
    susd_pool.methods
      .notifyRewardAmount("0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
    usdc_pool.methods
      .notifyRewardAmount("0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
    usdt_pool.methods
      .notifyRewardAmount("0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
    yfi_pool.methods
      .notifyRewardAmount("0x" + (2 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
    daibaclptoken_baspool.methods
      .notifyRewardAmount("0x" + (25 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
    daibaslptoken_baspool.methods
      .notifyRewardAmount("0x" + (75 * Math.pow(10, 22)).toString(16))
      .send({ from: accounts[0], gas: 100000 }),
  ]);
}
