const knownContracts = require('./known-contracts');
const { POOL_START_DATE } = require('./pools');

const Cash = artifacts.require('Cash');
const Share = artifacts.require('Share');
const Oracle = artifacts.require('Oracle');
const MockDai = artifacts.require('MockDai');

const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

const UniswapV2Factory = artifacts.require('UniswapV2Factory');

module.exports = async (deployer, network, accounts) => {
  const uniswapFactory = ['dev'].includes(network)
    ? await UniswapV2Factory.deployed()
    : await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]);
  const dai = network === 'mainnet'
    ? await IERC20.at(knownContracts.DAI[network])
    : await MockDai.deployed();

  const oracle = await Oracle.deployed();

  console.log("uniswapFactory address is: ",uniswapFactory.address);

  const dai_bac_lpt = await oracle.pairFor(uniswapFactory.address, Cash.address, dai.address);
  console.log("dai_bac_lpt address is: ",dai_bac_lpt);


  // const bac_dai_lpt = await oracle.pairFor(uniswapFactory.address, dai.address, Cash.address);
  // console.log("bac_dai_lpt address is: ",bac_dai_lpt.address);

};
