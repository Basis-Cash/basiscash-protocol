const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const Timelock = artifacts.require('Timelock');
const Oracle = artifacts.require('Oracle');
const BACSUSDPool = artifacts.require('BACSUSDPool');
const MockDai = artifacts.require('MockDai');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');


const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 86400;
// const SEIGNIORAGE_AMOUNT = web3.utils.toBN(10 ** 18).muln(10000).toString();
// const oneETH = web3.utils.toBN(10 ** 18).muln(1).toString();

const { ethers } = require("ethers");
const { utils } = require("ethers");
const knownContracts = require('./known-contracts');

module.exports = async (deployer, network, accounts) => {
  let uniswap;
  const cash = await Cash.deployed();
  console.log("cash address is: ",cash.address);
  
  const share = await Share.deployed();
  console.log("share address is: ",share.address);

  const bond = await Bond.deployed();
  console.log("bond address is: ",bond.address);

  const dai = await MockDai.deployed();
  console.log("dai address is: ",dai.address);

  uniswap = await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]);
  console.log("uniswap address is: ",uniswap.address);
  

  const dai_bac_pair = await uniswap.getPair(dai.address, cash.address);
  console.log("dai_bac_pair: ",dai_bac_pair);

  // const getReserves = await dai_bac_pair.getReserves.call();
  // console.log("getReserves: ",getReserves);




  

}
