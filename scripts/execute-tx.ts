import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { keccak256, ParamType } from 'ethers/lib/utils';
import { network, ethers } from 'hardhat';

import deployments from '../deployments/5.json';
import { wait } from './utils';

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
  const treasury = await ethers.getContractAt('Treasury', deployments.Treasury);

  const calldatas = [
    {
      desc: 'boardroom.transferOperator',
      calldata: [
        '0x4b182469337d46e6603ed7e26ba60c56930a342c',
        0,
        'transferOperator(address)',
        '0x0000000000000000000000004E153D084C28F20411D6EA01F7A18E0EC45E19D3',
        1608594051,
      ],
    },
    {
      desc: 'treasury.migrate',
      calldata: [
        '0x4e153d084c28f20411d6ea01f7a18e0ec45e19d3',
        0,
        'migrate(address)',
        '0x00000000000000000000000067A883D6F84A2D307D8F587B638E2F172EF2117A',
        1608594063,
      ],
    },
    {
      desc: 'boardroom.trasnferOperator',
      calldata: [
        '0x4b182469337d46e6603ed7e26ba60c56930a342c',
        0,
        'transferOperator(address)',
        '0x00000000000000000000000067A883D6F84A2D307D8F587B638E2F172EF2117A',
        1608594080,
      ],
    },
  ];

  for await (const queue of calldatas) {
    console.log(JSON.stringify(queue, null, 2));
    const tx = await timelock
      .connect(operator)
      .queueTransaction(...queue.calldata, override);
    await wait(ethers, tx.hash, `\ntimelock.queueTransaction => ${queue.desc}`);
  }

  const tx = await treasury.connect(operator).initialize();
  await wait(ethers, tx.hash, 'treasury.initialize');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
