const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const Timelock = artifacts.require('Timelock');
const Oracle = artifacts.require('Oracle');
const { ethers } = require("ethers");


const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 86400;
const SEIGNIORAGE_AMOUNT = web3.utils.toBN(10 ** 18).muln(10000).toString();


module.exports = async (deployer, network, accounts) => {

  const provider = new ethers.providers.Web3Provider(web3.currentProvider);

  // The Metamask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  const operator = provider.getSigner();

  const cash = await Cash.deployed();
  console.log("cash address is: ",cash.address);

  const boardroom = await Boardroom.deployed();
  console.log("boardroom address is: ",boardroom.address);

  const treasury = await Treasury.deployed();
  console.log("treasury address is: ",treasury.address);

  const cash_operator = await cash.operator.call();
  console.log("cash_operator : ",cash_operator);



  // console.log("cash minted ",SEIGNIORAGE_AMOUNT);
  // await cash.mint(treasury.address, SEIGNIORAGE_AMOUNT);
  // console.log("minted bdc: ",SEIGNIORAGE_AMOUNT);

  // await cash.approve(boardroom.address, SEIGNIORAGE_AMOUNT);

  const cash_totalSupply = await cash.totalSupply.call();
  console.log("cash_totalSupply: ",cash_totalSupply.toString());

  const board_operator = await boardroom.operator.call();
  console.log("board_operator: ",board_operator);

  console.log("booardroom allocateSeigniorage");
  await boardroom.allocateSeigniorage(SEIGNIORAGE_AMOUNT);

}
