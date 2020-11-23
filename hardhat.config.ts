import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';

export default {
  default: 'hardhat',
  networks: {
    hardhat: {},
  },
  solidity: {
    version: '0.6.12',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './build/cache',
    artifacts: './build/artifacts',
  },
  gasReporter: {
    currency: 'KRW',
    enabled: true,
  },
};
