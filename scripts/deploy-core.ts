import { network, ethers } from 'hardhat';
import { ParamType, keccak256 } from 'ethers/lib/utils';

import {
  DAI,
  ORACLE_START_DATE,
  TREASURY_START_DATE,
  UNI_FACTORY,
} from '../deploy.config';
import OLD from '../deployments/3.json';
import NEW from '../deployments/4.json';
import { wait } from './utils';

const DAY = 86400;
const override = { gasPrice: 100000000000 };

function encodeParameters(
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

async function main() {
  if (network.name !== 'mainnet') {
    throw new Error('wrong network');
  }

  const [operator] = await ethers.getSigners();

  // Fetch existing contracts
  // === token
  const cash = await ethers.getContractAt('Cash', OLD.Cash);
  const bond = await ethers.getContractAt('Bond', OLD.Bond);
  const share = await ethers.getContractAt('Share', OLD.Share);

  // === core
  const oracle = await ethers.getContractAt('Oracle', NEW.Oracle);
  const timelock = await ethers.getContractAt('Timelock', OLD.Timelock);
  const treasury = await ethers.getContractAt('Treasury', OLD.Treasury);

  if (operator.address !== (await timelock.admin())) {
    throw new Error(`Invalid admin ${operator.address}`);
  }
  console.log(`Admin verified ${operator.address}`);

  // const Oracle = await ethers.getContractFactory('Oracle');
  const Treasury = await ethers.getContractFactory('Treasury');
  const Boardroom = await ethers.getContractFactory('Boardroom');

  let tx;

  console.log('\n===================================================\n');

  console.log('=> Deploy\n');

  // const newOracle = await Oracle.connect(operator).deploy(
  //   UNI_FACTORY,
  //   cash.address,
  //   DAI,
  //   ORACLE_START_DATE,
  //   override
  // );
  // await wait(
  //   newOracle.deployTransaction.hash,
  //   `\nDeploy new Oracle => ${newOracle.address}`
  // );

  const newBoardroom = await Boardroom.connect(operator).deploy(
    cash.address,
    share.address,
    override
  );
  await wait(
    newBoardroom.deployTransaction.hash,
    `\nDeploy new Boardroom => ${newBoardroom.address}`
  );

  const newTreasury = await Treasury.connect(operator).deploy(
    cash.address,
    bond.address,
    share.address,
    oracle.address,
    newBoardroom.address,
    TREASURY_START_DATE,
    override
  );
  await wait(
    newTreasury.deployTransaction.hash,
    `\nDeploy new Treasury => ${newTreasury.address}`
  );

  console.log('\n===================================================\n');

  console.log('=> RBAC\n');

  tx = await newBoardroom
    .connect(operator)
    .transferOperator(newTreasury.address, override);
  await wait(tx.hash, 'boardroom.transferOperator');

  tx = await newBoardroom
    .connect(operator)
    .transferOwnership(timelock.address, override);
  await wait(tx.hash, 'boardroom.transferOwnership');

  tx = await newTreasury
    .connect(operator)
    .transferOperator(timelock.address, override);
  await wait(tx.hash, 'treasury.transferOperator');

  tx = await newTreasury
    .connect(operator)
    .transferOwnership(timelock.address, override);
  await wait(tx.hash, 'treasury.transferOwnership');

  console.log('\n===================================================\n');

  console.log('=> Migration\n');

  const eta = Math.round(new Date().getTime() / 1000) + 2 * DAY + 60;
  const signature = 'migrate(address)';
  const data = encodeParameters(['address'], [newTreasury.address]);
  const calldata = [treasury.address, 0, signature, data, eta];
  const txHash = keccak256(
    encodeParameters(
      ['address', 'uint256', 'string', 'bytes', 'uint256'],
      calldata
    )
  );

  tx = await timelock.connect(operator).queueTransaction(...calldata, override);
  await wait(tx.hash, `timelock.queueTransaction => txHash: ${txHash}`);
  console.log(`Tx execution ETA: ${eta}`);

  const isQueued = await timelock.connect(operator).queuedTransactions(txHash);

  if (!isQueued) {
    throw new Error('wtf');
  }

  console.log('OK!');

  console.log('\n===================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
