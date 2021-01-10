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
const SEIGNIORAGE_AMOUNT = web3.utils.toBN(10 ** 18).muln(10000).toString();


module.exports = async (deployer, network, accounts) => {
  const cash = await Cash.deployed();
  console.log("cash address is: ",cash.address);

  const boardroom = await Boardroom.deployed();
  console.log("boardroom address is: ",boardroom.address);

  const treasury = await Treasury.deployed();
  console.log("treasury address is: ",treasury.address);

  const timelock = await Timelock.deployed();
  console.log("timelock address is: ",timelock.address);

  console.log("cash minted ",SEIGNIORAGE_AMOUNT);
  await cash.mint(treasury.address, SEIGNIORAGE_AMOUNT);
  await cash.approve(boardroom.address, SEIGNIORAGE_AMOUNT);

  console.log("booardroom allocateSeigniorage");
  await boardroom.allocateSeigniorage(SEIGNIORAGE_AMOUNT)
  

}
