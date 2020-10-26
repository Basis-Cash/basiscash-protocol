// https://docs.basis.cash/mechanisms/yield-farming
const INITIAL_BAC_FOR_POOLS = 50000;

const POOL_START_DATE = Date.parse('2020-10-10T00:00:00Z');

const bacPools = [
  { contract: artifacts.require('BACDAIPool'), token: 'DAI' },
  { contract: artifacts.require('BACSUSDPool'), token: 'SUSD' },
  { contract: artifacts.require('BACUSDCPool'), token: 'USDC' },
  { contract: artifacts.require('BACUSDTPool'), token: 'USDT' },
  { contract: artifacts.require('BACyCRVPool'), token: 'yCRV' },
];

const lpPools = [
  { contract: artifacts.require('DAIBACLPTokenSharePool'), token: 'DAI_BAC-LPv2' },
  { contract: artifacts.require('DAIBASLPTokenSharePool'), token: 'DAI_BAS-LPv2' },
];

module.exports = {
  INITIAL_BAC_FOR_POOLS,
  bacPools,
  lpPools,
};
