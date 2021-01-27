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

const { ethers } = require("ethers");
const { utils,constants} = require("ethers");


module.exports = async (deployer, network, accounts) => {
  // utils
  // const oneETH = utils.parseEther('1');
  // const amount = oneETH.mul(10);
  // const price = oneETH.mul(87).div(100);

  // console.log("amount: ",amount.toString());
  // console.log("price: ",price.toString());

  // connect to metamask
  // A Web3Provider wraps a standard Web3 provider, which is
  // what Metamask injects as window.ethereum into each page
  const provider = new ethers.providers.Web3Provider(web3.currentProvider);

  // The Metamask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  const signer = provider.getSigner();
  const account0 = signer.getAddress();
  console.log("provider.getSigner().getAddress(): ",await (await signer.getAddress()).toString());

  // // Look up the current block number
  // const getBlockNumber = await provider.getBlockNumber();
  // console.log("provider.getBlockNumber(): ",getBlockNumber.toString());

  // // getBalance
  // const getBalance = await provider.getBalance(account0);
  // console.log("getBalance is: ",getBalance.toString());

  // // getBalance in ETH
  // const getBalance_eth = ethers.utils.formatEther(getBalance)
  // console.log("getBalance_eth : ",getBalance_eth);

  // // define twoETH
  // const twoETH = ethers.utils.parseEther("1.0").mul(2);
  // console.log("twoETH in wei is: ",twoETH.toString());


  // deploy new mockDAI2
  // const MockDai2 = artifacts.require('MockDai');
  // // const dai2 = await deployer.deploy(MockDai2);
  // // console.log(`MockDAI2 address: ${dai2.address}`);

  // // getDAI information
  // const dai2 = await MockDai2.deployed();
  // console.log("dai2 name is: ",await dai2.name());
  // console.log("dai2 name is: ",await dai2.address);

  const one = constants.One;
  console.log("one is: ",one.toString());

  const WeiPerEther = constants.WeiPerEther;
  console.log("WeiPerEther is: ",WeiPerEther.toString());




}
