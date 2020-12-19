import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { keccak256, ParamType } from 'ethers/lib/utils';
import { network, ethers } from 'hardhat';

import deployments from '../deployments/5.json';
import { wait } from './utils';

function encodeParameters(
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

async function main() {
  const { provider } = ethers;
  const [operator] = await ethers.getSigners();

  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  const override = { gasPrice };

  const timelock = await ethers.getContractAt('Timelock', deployments.Timelock);

  const eta = Math.round(new Date().getTime() / 1000) + 2 * DAY + 60;

  const calldata = [
    '0x4e153d084c28F20411D6EA01f7A18E0Ec45E19d3',
    0,
    'migrate(address)',
    encodeParameters(
      ['address'],
      ['0xe5Fc22DB659b09A476622bea3a612c9252b27884']
    ),
    eta,
  ];
  const txHash = keccak256(
    encodeParameters(
      ['address', 'uint256', 'string', 'bytes', 'uint256'],
      calldata
    )
  );

  const tx = await timelock
    .connect(operator)
    .queueTransaction(...calldata, override);
  await wait(tx.hash, `timelock.queueTransaction => txHash: ${txHash}`);
  console.log(`Tx execution ETA: ${eta}`);

  if (!(await timelock.connect(operator).queuedTransactions(txHash))) {
    throw new Error('wtf');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
