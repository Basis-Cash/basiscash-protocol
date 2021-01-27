const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const Timelock = artifacts.require('Timelock');
const Oracle = artifacts.require('Oracle');


const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 86400;
// const SEIGNIORAGE_AMOUNT = web3.utils.toBN(10 ** 18).muln(10000).toString();
// const oneETH = web3.utils.toBN(10 ** 18).muln(1).toString();

const { ethers } = require("ethers");
const { utils } = require("ethers");


module.exports = async (deployer, network, accounts) => {
  const timelock = await Timelock.deployed();
  console.log("timelock address is: ",timelock.address);

  console.log("---------- Param ---------");
  const GRACE_PERIOD = await timelock.GRACE_PERIOD.call();
  console.log("GRACE_PERIOD: ",GRACE_PERIOD.toString());

  const MINIMUM_DELAY = await timelock.MINIMUM_DELAY.call();
  console.log("MINIMUM_DELAY: ",MINIMUM_DELAY.toString());

  const MAXIMUM_DELAY = await timelock.MAXIMUM_DELAY.call();
  console.log("MAXIMUM_DELAY: ",MAXIMUM_DELAY.toString());

  console.log("---------- end of Param ---------");


  console.log("---------- Admin ---------");
  const admin = await timelock.admin.call();
  console.log("admin: ",admin.toString());

  const pendingAdmin = await timelock.pendingAdmin.call();
  console.log("pendingAdmin: ",pendingAdmin.toString());

  const delay = await timelock.delay.call();
  console.log("delay: ",delay.toString());

  console.log("---------- end of Admin ---------");

  const queuedTransactions = await timelock.queuedTransactions.call(0);
  // console.log("queuedTransactions: ",queuedTransactions[0]);

}
