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

const override2 = {
    gasPrice: web3.utils.toHex(20116320554),
    gasLimit: web3.utils.toHex(7890000)
  };

async function main() {
  // if (network.name !== 'mainnet') {
  //   throw new Error('wrong network');
  // }

  const { provider } = ethers;
  const [operator] = await ethers.getSigners();

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

  console.log("---------- boardroom.action ------------");

  console.log("---- setupLockup ---");
  const withdrawLockupEpochs_NewValue = 6;
  const rewardLockupEpochs_NewValue = 0;
  const epochAlignTimestamp_NewValue = 1608883200;
  const epochPeriod_NewValue = 60;

  // await boardroom.setLockUp(withdrawLockupEpochs_NewValue
  //   ,rewardLockupEpochs_NewValue
  //   ,epochAlignTimestamp_NewValue
  //   ,epochPeriod_NewValue
  //   );
  await treasury.setLockUp(withdrawLockupEpochs_NewValue
      ,rewardLockupEpochs_NewValue
      ,epochAlignTimestamp_NewValue
      ,epochPeriod_NewValue
  );
  console.log("---- end of setupLockup ---");




  console.log("---------- end of boardroom.action ------------");







  console.log('OK!');

  console.log('\n===================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
