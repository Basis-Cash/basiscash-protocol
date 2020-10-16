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

async function migration(deployer, network, accounts) {
  const unit = web3.utils.toBN(10 ** 18);

  console.log('Distributing initial Basis Cash');
  const cash = await Cash.deployed();
  await Promise.all([
    cash.mint(BAC_DAIPool.address, unit.muln(20000).toString()),
    cash.mint(BAC_SUSDPool.address, unit.muln(20000).toString()),
    cash.mint(BAC_USDCPool.address, unit.muln(20000).toString()),
    cash.mint(BAC_USDTPool.address, unit.muln(20000).toString()),
    cash.mint(BAC_yCRVPool.address, unit.muln(20000).toString()),
  ]);

  console.log('Distributing initial Basis Share');
  const share = await Share.deployed();
  await Promise.all([
    share.mint(DAIBACLPToken_BASPool.address, unit.muln(250000).toString()),
    share.mint(DAIBASLPToken_BASPool.address, unit.muln(750000).toString()),
  ]);
}

module.exports = migration;
