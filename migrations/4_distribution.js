const knownContracts = require('./known-contracts');
const { bacPools } = require('./pools');

// Tokens
// deployed first
const Cash = artifacts.require('Cash');
const MockDai = artifacts.require('MockDai');

// ============ Main Migration ============
module.exports = async (deployer, network, accounts) => {
  for (const { contract, token } of bacPools) {
    const tokenAddress = knownContracts[token][network] || MockDai.address;
    if (!tokenAddress) {
      // network is mainnet, so MockDai is not available
      throw new Error(`Address of ${token} is not registered on migrations/known-contracts.js!`);
    }
    await deployer.deploy(contract, Cash.address, tokenAddress);
  }
};
