import { network, ethers } from 'hardhat';
import { Boardroom, Timelock } from '../deployments/4-2.json';
import { wait } from './utils';

async function main() {
  if (network.name !== 'mainnet') {
    throw new Error('wrong network');
  }

  const { provider } = ethers;
  const [operator] = await ethers.getSigners();

  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  const boardroom = await ethers.getContractAt('Boardroom', Boardroom);
  const timelock = await ethers.getContractAt('Timelock', Timelock);

  if (operator.address !== (await timelock.admin())) {
    throw new Error(`Invalid admin ${operator.address}`);
  }
  console.log(`Admin verified ${operator.address}`);

  const VoteProxy = await ethers.getContractFactory('VoteProxy');

  console.log('\n===================================================\n');

  console.log('=> Deploy\n');

  const voteProxy = await VoteProxy.connect(operator).deploy(
    boardroom.address,
    { gasPrice }
  );
  await wait(
    voteProxy.deployTransaction.hash,
    `\nDeploy vote proxy => ${voteProxy.address}`
  );

  console.log('\n===================================================\n');

  console.log('=> RBAC\n');

  let tx;

  tx = await voteProxy
    .connect(operator)
    .transferOperator(timelock.address, { gasPrice });
  await wait(tx.hash, 'voteProxy.transferOperator');

  tx = await voteProxy
    .connect(operator)
    .transferOwner(timelock.address, { gasPrice });
  await wait(tx.hash, 'voteProxy.transferOwnership');

  console.log('OK!');

  console.log('\n===================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
