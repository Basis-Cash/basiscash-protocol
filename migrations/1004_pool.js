const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const Timelock = artifacts.require('Timelock');
const Oracle = artifacts.require('Oracle');
const BACSUSDPool = artifacts.require('BACSUSDPool');


const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 86400;
// const SEIGNIORAGE_AMOUNT = web3.utils.toBN(10 ** 18).muln(10000).toString();
// const oneETH = web3.utils.toBN(10 ** 18).muln(1).toString();

const { ethers } = require("ethers");
const { utils } = require("ethers");


module.exports = async (deployer, network, accounts) => {
  const BACSUSDPool = await BACSUSDPool.deployed();
  console.log("BACSUSDPool address is: ",BACSUSDPool.address);




  

}
