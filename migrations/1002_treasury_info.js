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
  const treasury = await Treasury.deployed();
  console.log("treasury address is: ",treasury.address);

  // const migrated = await treasury.migrated.call();
  // console.log("migrated: ",migrated.toString()); 

  // const initialized = await treasury.initialized.call();
  // console.log("initialized: ",initialized.toString()); 

  // // Core Information

  // console.log("--------------- Core Information -------------------")
  // const fund = await treasury.fund.call();
  // console.log("fund: ",fund.toString()); 

  // const cash = await treasury.cash.call();
  // console.log("cash: ",cash.toString()); 

  // const bond = await treasury.bond.call();
  // console.log("bond: ",bond.toString()); 

  // const share = await treasury.share.call();
  // console.log("share: ",share.toString()); 

  // const boardroom = await treasury.boardroom.call();
  // console.log("boardroom: ",boardroom.toString()); 

  // console.log("--------------- End of Core Information -------------------")


  // console.log("--------------- Parameters Information -------------------");
  // const cashPriceOne = await treasury.cashPriceOne.call();
  // console.log("cashPriceOne: ",cashPriceOne.toString()); 

  // const cashPriceCeiling = await treasury.cashPriceCeiling.call();
  // console.log("cashPriceCeiling: ",cashPriceCeiling.toString()); 

  // const bondDepletionFloor = await treasury.bondDepletionFloor.call();
  // console.log("bondDepletionFloor: ",bondDepletionFloor.toString()); 

  // const fundAllocationRate = await treasury.fundAllocationRate.call();
  // console.log("fundAllocationRate: ",fundAllocationRate.toString()); 

  // console.log("--------------- End of Parameters Information -------------------");

  // console.log("--------------- View Functions  -------------------");
  
  // const getReserve = await treasury.getReserve()
  // console.log("getReserve: ",getReserve.toString());  

  // const getBondOraclePrice = await treasury.getBondOraclePrice()
  // console.log("getBondOraclePrice: ",getBondOraclePrice.toString());  

  // const getSeigniorageOraclePrice = await treasury.getSeigniorageOraclePrice()
  // console.log("getSeigniorageOraclePrice: ",getSeigniorageOraclePrice.toString());  




  // console.log("--------------- End of View Functions  -------------------");

  const oneETH = utils.parseEther('1');
  const amount = oneETH.mul(10);
  const price = oneETH.mul(87).div(100);

  console.log("amount: ",amount.toString());
  console.log("price: ",price.toString());




  // await treasury.buyBonds(amount,price);



  // -------------- begin bac minted 10000 and allocateSeigniorage -----------------------
  // const cash = await Cash.deployed();
  // console.log("cash address is: ",cash.address);

  // const treasury = await Treasury.deployed();
  // console.log("treasury address is: ",treasury.address);

  // const timelock = await Timelock.deployed();
  // console.log("timelock address is: ",timelock.address);

  // console.log("cash minted ",SEIGNIORAGE_AMOUNT);
  // await cash.mint(treasury.address, SEIGNIORAGE_AMOUNT);
  // await cash.approve(boardroom.address, SEIGNIORAGE_AMOUNT);

  // console.log("booardroom allocateSeigniorage");
  // await boardroom.allocateSeigniorage(SEIGNIORAGE_AMOUNT)
  // -------------- end bac minted 10000 and allocateSeigniorage -----------------------


  // const latestSnapshotIndex = await boardroom.latestSnapshotIndex()
  // console.log("latestSnapshotIndex: ",latestSnapshotIndex.toString());

  // const address0 = accounts[0];
  // const getLastSnapshotIndexOf = await boardroom.getLastSnapshotIndexOf(address0);
  // console.log("getLastSnapshotIndexOf: ",getLastSnapshotIndexOf.toString());


  // const rewardPerShare = await boardroom.rewardPerShare()
  // console.log("rewardPerShare: ",rewardPerShare.toString());

  // const earned = await boardroom.earned(address0);
  // console.log("earned: ",earned.toString());

  // it send tx
  // await boardroom.stake(oneETH);
  // console.log("boardroom.staked: ",oneETH);

  // it send tx
  // await boardroom.withdraw(oneETH);
  // console.log("boardroom.withdraw: ",oneETH);

  // it send tx
  // await boardroom.claimReward();
  // console.log("boardroom.claimReward");

}
