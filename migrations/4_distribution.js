const knownContracts = require('./known-contracts');

// Tokens
// deployed first
const Cash = artifacts.require('Cash');
const MockDai = artifacts.require('MockDai');

// ============ Reward Distribution Pools ============
const pools = [
  { contract: artifacts.require('BACDAIPool'), token: 'DAI' },
  { contract: artifacts.require('BACSUSDPool'), token: 'SUSD' },
  { contract: artifacts.require('BACUSDCPool'), token: 'USDC' },
  { contract: artifacts.require('BACUSDTPool'), token: 'USDT' },
  { contract: artifacts.require('BACyCRVPool'), token: 'yCRV' },
];

// ============ Main Migration ============
module.exports = async (deployer, network, accounts) => {
  for (const { contract, token } of pools) {
    const tokenAddress = knownContracts[token][network] || MockDai.address;
    if (!tokenAddress) {
      // network is mainnet, so MockDai is not available
      throw new Error(`Address of ${token} is not registered on migrations/known-contracts.js!`);
    }
    await deployer.deploy(contract, Cash.address, tokenAddress);
  }
  console.log(`Setting distributor to ${accounts[0]}`);
  await Promise.all(
    pools.map(({ contract }) => contract
      .deployed()
      .then(pool => pool.setRewardDistribution(accounts[0]))
    ),
  );
};
