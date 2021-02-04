const { bacPools, INITIAL_BAC_FOR_POOLS } = require('../pools');

// Pools
// deployed first
const Cash = artifacts.require('Cash')


// ============ Main Migration ============

module.exports = async (deployer, network, accounts) => {
  const unit = web3.utils.toBN(10 ** 18);
  const initial_amount = INITIAL_BAC_FOR_POOLS*100;
  const initialCashAmount = unit.muln(initial_amount).toString();

  const cash = await Cash.deployed();  
  await cash.mint(accounts[0], initialCashAmount);

  console.log(`Deposited ${initial_amount} BDC to `,accounts[0]);

}
