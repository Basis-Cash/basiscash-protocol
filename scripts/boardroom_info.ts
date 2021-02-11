import { network, ethers } from 'hardhat';
import { ParamType, keccak256 } from 'ethers/lib/utils';
const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider);

import {
  DAI,
  ORACLE_START_DATE,
  TREASURY_START_DATE,
  UNI_FACTORY,
} from '../deploy.config';
import OLD from '../deployments/013101.json';
import { wait } from './utils';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function encodeParameters(
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

async function main() {
  // if (network.name !== 'mainnet') {
  //   throw new Error('wrong network');
  // }

  const { provider } = ethers;
  const [operator] = await ethers.getSigners();
  const address0 = operator.address;

  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log("gasPrice: ",gasPrice.toString());
  const gasLimit = 7550000;

  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  const override = { 
    gasPrice: 20116320554,
    gasLimit: 7890000
  };

  const override2 = { 
    gasPrice: web3.utils.toHex(20116320554),
    gasLimit: web3.utils.toHex(7890000)
  };




  console.log("provider: ",provider.detectNetwork);
  console.log("operater: ",operator.address);

  // Fetch existing contracts
  // === token
  const cash = await ethers.getContractAt('Cash', OLD.Cash);
  const bond = await ethers.getContractAt('Bond', OLD.Bond);
  const share = await ethers.getContractAt('Share', OLD.Share);
  // console.log("cash.address: ",cash.address);
  // console.log("bond.address: ",bond.address);
  // console.log("share.address: ",share.address);

  // === core
  const seigniorageOracle = await ethers.getContractAt('Oracle', OLD.Oracle);
  const timelock = await ethers.getContractAt('Timelock', OLD.Timelock);
  const treasury = await ethers.getContractAt('Treasury', OLD.Treasury);
  const boardroom = await ethers.getContractAt('Boardroom', OLD.Boardroom);

  // console.log("seigniorageOracle: ",seigniorageOracle.address);
  // console.log("timelock: ",timelock.address);
  // console.log("treasury: ",treasury.address);
  // console.log("boardroom: ",boardroom.address);

  console.log('Deployments');
  console.log(JSON.stringify(OLD, null, 2));

  if (operator.address !== (await timelock.admin())) {
    throw new Error(`Invalid admin ${operator.address}`);
  }
  console.log(`Admin verified ${operator.address}`);

  const Oracle = await ethers.getContractFactory('Oracle');
  const Treasury = await ethers.getContractFactory('Treasury');
  // const Boardroom = await ethers.getContractFactory('Boardroom');
  const SimpleFund = await ethers.getContractFactory('SimpleERCFund');

  let eta;
  let calldata;
  let txHash;
  let tx;

  console.log("Boardroom.address: ",boardroom.address);

  console.log("----------- Parameters -------------- ");

  const boardroom_operator_address = await boardroom.operator.call();
  console.log("boardroom_operator_address: ",boardroom_operator_address);



  const boardroom_withdrawLockupEpochs = await boardroom.withdrawLockupEpochs.call();
  console.log("boardroom_withdrawLockupEpochs: ",boardroom_withdrawLockupEpochs.toString());

  const boardroom_rewardLockupEpochs = await boardroom.rewardLockupEpochs.call();
  console.log("boardroom_rewardLockupEpochs: ",boardroom_rewardLockupEpochs.toString());

  const boardroom_epochAlignTimestamp = await boardroom.epochAlignTimestamp.call();
  console.log("boardroom_epochAlignTimestamp: ",boardroom_epochAlignTimestamp.toString());

  const boardroom_epochPeriod = await boardroom.epochPeriod.call();
  console.log("boardroom_epochPeriod: ",boardroom_epochPeriod.toString());

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


  // const  withdrawLockupEpochs = await boardroom.withdrawLockupEpochs.call();
  // console.log("withdrawLockupEpochs: ",withdrawLockupEpochs.toString());

  // const  rewardLockupEpochs = await boardroom.rewardLockupEpochs.call();
  // console.log("rewardLockupEpochs: ",rewardLockupEpochs.toString());

  // const  epochAlignTimestamp = await boardroom.epochAlignTimestamp.call();
  // console.log("epochAlignTimestamp: ",epochAlignTimestamp.toString());

  // const  epochPeriod = await boardroom.epochPeriod.call();
  // console.log("epochPeriod: ",epochPeriod.toString());

  console.log("----------- End of Parameters -------------- ");


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
