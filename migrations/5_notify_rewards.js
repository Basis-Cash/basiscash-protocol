const BAC_DAIPool = artifacts.require('BACDAIPool')
const BAC_SUSDPool = artifacts.require('BACSUSDPool')
const BAC_USDCPool = artifacts.require('BACUSDCPool')
const BAC_USDTPool = artifacts.require('BACUSDTPool')
const BAC_yCRVPool = artifacts.require('BACyCRVPool')
const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

async function migration(deployer, network, accounts) {
  const unit = web3.utils.toBN(10 ** 18);

  console.log('notifying')
  console.log('basis cash')
  const dai_pool = await BAC_DAIPool.deployed();
  const susd_pool = await BAC_SUSDPool.deployed();
  const usdc_pool = await BAC_USDCPool.deployed();
  const usdt_pool = await BAC_USDTPool.deployed();
  const ycrv_pool = await BAC_yCRVPool.deployed();

  const daibaclptoken_baspool = await DAIBACLPToken_BASPool.deployed();
  const daibaslptoken_baspool = await DAIBASLPToken_BASPool.deployed();

  await Promise.all([
    dai_pool.notifyRewardAmount(unit.muln(20000).toString()),
    susd_pool.notifyRewardAmount(unit.muln(20000).toString()),
    usdc_pool.notifyRewardAmount(unit.muln(20000).toString()),
    usdt_pool.notifyRewardAmount(unit.muln(20000).toString()),
    ycrv_pool.notifyRewardAmount(unit.muln(20000).toString()),

    daibaclptoken_baspool.notifyRewardAmount(unit.muln(250000).toString()),
    daibaslptoken_baspool.notifyRewardAmount(unit.muln(750000).toString()),
  ]);
}

module.exports = migration;
