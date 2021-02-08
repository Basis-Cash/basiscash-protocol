const DAY = 86400;

export const MIGRATION_START_TIME = Date.parse('2021-02-09T00:00:00Z') / 1000;
export const MIGRATION_PERIOD = 15 * DAY;

export const BASV1_POOL_FINISH = Date.parse('2021-11-30T00:00:00Z') / 1000;
export const BASV1_REWARD_RATE = '7927447995941146';
export const BASV2_POOL_FINISH = Date.parse('2021-11-16T00:00:00Z') / 1000;

export const CONTRACTS: { [network: string]: { [name: string]: any } } = {
  mainnet: {
    core: {
      boardroom: '0x4B182469337d46E6603ed7e26BA60c56930a342c',
      treasury: '0x7715a2cA2C9Ae2C6cDE525F9588EDed073DF3430',
      bacDaiPool: '0x067d4D3CE63450E74F880F86b5b52ea3edF9Db0f',
      basDaiPool: '0x9569d4CD7AC5B010DA5697E952EFB1EC0Efb0D0a',
    },
    uniswap: {
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    },
    tokens: {
      dai: '0x6b175474e89094c44da98b954eedeac495271d0f',
      bond: '0xC36824905dfF2eAAEE7EcC09fCC63abc0af5Abc5',
      cash: '0x3449FC1Cd036255BA1EB19d65fF4BA2b8903A69a',
      shareV1: '0xa7ED29B253D8B4E3109ce07c80fc570f81B63696',
      shareV2: '',
    },
  },
  rinkeby: {
    core: {
      boardroom: '0x3FF0e82C53B5498d03EE9e54b0598DFA281FC30e',
      treasury: '0x7Ab8877F490e49D07A652a2f83924635B6D72a7F',
      bacDaiPool: '0x6C2742b99e72419B6F34ca4506A067a725AdE3D8',
      basDaiPool: '0x5eCB855560Cf5A062916e07eA15F60cdBb4e071E',
    },
    uniswap: {
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    },
    tokens: {
      dai: '0x4E611E19E05B8d5991cAaC6023b750Fd3007D483',
      bond: '0xf5998aDE79156B233aCD5980205bDbece8Fb0559',
      cash: '0xb7938e12Ee63e97Ae6Ad9990982B745Ddd0F1e22',
      shareV1: '0x74Bd2D24dC1E7c70F4eFAB8a1Dd0B79dA5951289',
      shareV2: '',
    },
  },
};
