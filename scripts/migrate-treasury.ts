import { network, ethers } from 'hardhat';
import { Contract } from 'ethers';
import { ParamType, keccak256 } from 'ethers/lib/utils';

import { TREASURY_START_DATE } from '../deploy.config';
import deployments from '../deployments.json';
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

  const cash = await ethers.getContractAt('Cash', deployments.Cash);
  const bond = await ethers.getContractAt('Bond', deployments.Bond);
  const share = await ethers.getContractAt('Share', deployments.Share);
  const oracle = await ethers.getContractAt('Oracle', deployments.Oracle);
  const timelock = await ethers.getContractAt('Timelock', deployments.Timelock);

  if (operator.address !== (await timelock.admin())) {
    throw new Error(`Invalid admin ${operator.address}`);
  }
  console.log(`Admin verified ${operator.address}`);

  const Treasury = await ethers.getContractFactory('Treasury');
  const Boardroom = await ethers.getContractFactory('Boardroom');

  const treasury = await Treasury.attach(deployments.Treasury);

  let tx;

  console.log('\n===================================================\n');

  console.log('=> Deploy\n');

  const newBoardroom = await Boardroom.connect(operator).deploy(
    cash.address,
    share.address,
    override
  );
  await wait(
    newBoardroom.deployTransaction.hash,
    `Deploy new Boardroom => ${newBoardroom.address}`
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
    `Deploy new Treasury => ${newTreasury.address}`
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

  const eta = 1607182000;
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
  await wait(tx.hash, `timelock.queueTransaction => payload: ${calldata}`);

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
