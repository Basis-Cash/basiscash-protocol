const { bacPools, INITIAL_BAC_FOR_POOLS } = require('../pools');

// Pools
// deployed first
const Share = artifacts.require('Share')


// ============ Main Migration ============

module.exports = async (deployer, network, accounts) => {
  const unit = web3.utils.toBN(10 ** 18);
  const initialCashAmount = unit.muln(INITIAL_BAC_FOR_POOLS).toString();

  const share = await Share.deployed();  
  await share.mint(accounts[0], initialCashAmount);

  console.log(`Deposited ${INITIAL_BAC_FOR_POOLS} BDS to `,accounts[0]);

}
