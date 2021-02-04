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
const oneETH = web3.utils.toBN(10 ** 18).muln(1).toString();


module.exports = async (deployer, network, accounts) => {
  const boardroom = await Boardroom.deployed();
  console.log("boardroom address is: ",boardroom.address);

  console.log("---- setupLockup ---");
  const withdrawLockupEpochs_NewValue = 6;
  const rewardLockupEpochs_NewValue = 0;
  const epochAlignTimestamp_NewValue = 1608883201;
  const epochPeriod_NewValue = 60;

  await boardroom.setLockUp(withdrawLockupEpochs_NewValue
    ,rewardLockupEpochs_NewValue
    ,epochAlignTimestamp_NewValue
    ,epochPeriod_NewValue
    );
  console.log("---- end of setupLockup ---");

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




  // const canWithdraw = await boardroom.canWithdraw(address0);
  // console.log ("canWithdraw: ",canWithdraw.toString());

  // const canClaimReward = await boardroom.canClaimReward(address0);
  // console.log ("canClaimReward: ",canClaimReward.toString());

  // const getCurrentEpochTimestamp = await boardroom.getCurrentEpochTimestamp.call();
  // console.log("getCurrentEpochTimestamp-------: ",getCurrentEpochTimestamp.toString());

  // const getCanWithdrawTime = await boardroom.getCanWithdrawTime(address0);
  // console.log("getCanWithdrawTime-------------: ",getCanWithdrawTime.toString());

  // const getCanClaimTime = await boardroom.getCanClaimTime(address0);
  // console.log("getCanClaimTime----------------: ",getCanClaimTime.toString());

  // console.log("----------- Parameters -------------- ");
  // const withdrawLockupEpochs = await boardroom.withdrawLockupEpochs.call();
  // console.log ("withdrawLockupEpochs: ",withdrawLockupEpochs.toString());

  // const rewardLockupEpochs = await boardroom.rewardLockupEpochs.call();
  // console.log ("rewardLockupEpochs: ",rewardLockupEpochs.toString());

  // const epochAlignTimestamp = await boardroom.epochAlignTimestamp.call();
  // console.log ("epochAlignTimestamp: ",epochAlignTimestamp.toString());

  // const epochPeriod = await boardroom.epochPeriod.call();
  // console.log ("epochPeriod: ",epochPeriod.toString());

  // console.log("----------- End of Parameters -------------- ");





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
