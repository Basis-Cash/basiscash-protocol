// https://docs.basis.cash/mechanisms/yield-farming
const INITIAL_BAC_FOR_POOLS = 160000;
const INITIAL_BAS_FOR_DAI_BAC = 750000;
const INITIAL_BAS_FOR_DAI_BAS = 250000;

// const POOL_START_DATE = Date.parse('2020-11-30T00:00:00Z') / 1000;
const POOL_START_DATE = Date.parse('2020-12-30T02:00:00Z') / 1000; // plus 8 hours is our time zone
// const POOL_START_DATE = Date.parse('2020-12-25T08:00:00Z') / 1000; // plus 8 hours is our time zone

const bacPools = [
  { contractName: 'MICDAIPool', token: 'DAI' },
  { contractName: 'MICUSDTPool', token: 'USDT' },
  { contractName: 'MICESDPool', token: 'ESD' },
  { contractName: 'MICBACPool', token: 'BAC' },
  { contractName: 'MICMITHPool', token: 'MITH' },
  { contractName: 'MICCREAMPool', token: 'CREAM' },
  { contractName: 'MICFRAXPool', token: 'FRAX' },
  { contractName: 'MICYFIPool', token: 'YFI' },
  { contractName: 'MICCRVPool', token: 'CRV' },
  { contractName: 'MICBUSDPool', token: 'BUSD' },
  { contractName: 'MICLINKPool', token: 'LINK' },
  { contractName: 'MICCOMPPool', token: 'COMP' },
  { contractName: 'MICAAVEPool', token: 'AAVE' },
  { contractName: 'MICUSDCPool', token: 'USDC' },
  { contractName: 'MICSUSHIPool', token: 'SUSHI' },
  { contractName: 'MICSUSDPool', token: 'SUSD' },
];

const basPools = {
  DAIMIC: { contractName: 'DAIMICLPTokenSharePool', token: 'DAI_MIC-LPv2' },
  DAIMIS: { contractName: 'DAIMISLPTokenSharePool', token: 'DAI_MIS-LPv2' },
}

module.exports = {
  POOL_START_DATE,
  INITIAL_BAC_FOR_POOLS,
  INITIAL_BAS_FOR_DAI_BAC,
  INITIAL_BAS_FOR_DAI_BAS,
  bacPools,
  basPools,
};
