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

  console.log("---------- treasury.allocate ------------");
  
  await treasury.allocateSeigniorage(override2);
  // await treasury.allocateSeigniorage();
  
    

  console.log("---------- end of treasury.allocate ------------");


  





  // 2. treasury.allocateSeigniorage queueTransaction
  // eta = Math.round(new Date().getTime() / 1000) + 2 * DAY + 60;
  // eta = Math.round(new Date().getTime() / 1000) + 300;
  // calldata = [
  //   treasury.address,
  //   0,
  //   'allocateSeigniorage()',
  //   0,
  //   eta,
  // ];
  // txHash = keccak256(
  //   encodeParameters(
  //     ['address', 'uint256', 'string', 'bytes', 'uint256'],
  //     calldata
  //   )
  // );

  // tx = await timelock.connect(operator).queueTransaction(...calldata, override);
  // await wait(
  //   tx.hash,
  //   `\n2. timelock.queueTransaction (treasury.allocateSeigniorage) => txHash: ${txHash}`
  // );
  // console.log(`Tx execution ETA: ${eta}`);

  // if (!(await timelock.connect(operator).queuedTransactions(txHash))) {
  //   throw new Error('wtf');
  // }

  // 3. treasury.allocateSeigniorage execTransaction
  // eta = Math.round(new Date().getTime() / 1000) + 2 * DAY + 60;
  // eta = 1611907005;
  // calldata = [
  //   treasury.address,
  //   0,
  //   'allocateSeigniorage()',
  //   0,
  //   eta,
  // ];
  // txHash = keccak256(
  //   encodeParameters(
  //     ['address', 'uint256', 'string', 'bytes', 'uint256'],
  //     calldata
  //   )
  // );

  // tx = await timelock.connect(operator).executeTransaction(...calldata, override);
  // await wait(
  //   tx.hash,
  //   `\n2. timelock.executeTransaction (treasury.allocateSeigniorage) => txHash: ${txHash}`
  // );
  // console.log(`Tx execution ETA: ${eta}`);

  // if (!(await timelock.connect(operator).queuedTransactions(txHash))) {
  //   throw new Error('wtf');
  // }




  console.log('OK!');

  console.log('\n===================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
