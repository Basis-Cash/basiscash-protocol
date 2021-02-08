import { Contract, ContractFactory } from 'ethers';
import { network, ethers } from 'hardhat';

import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UniswapV2Router from '@uniswap/v2-periphery/build/UniswapV2Router02.json';

import { deployBoardroom } from './deploy-boardroom';
import { deployMigrator } from './deploy-migrator';
import { deployPool } from './deploy-pool';
import { deployToken } from './deploy-token';
import { deployTreasury } from './deploy-treasury';
import { CONTRACTS } from './config';
import { wait } from './utils';

function transformer(contracts: {
  [name: string]: Contract;
}): { [name: string]: string } {
  return Object.entries(contracts).reduce((acc, [name, contract]) => {
    acc[`${name.charAt(0).toUpperCase()}${name.slice(1)}`] = contract.address;
    return acc;
  }, {} as { [name: string]: string });
}

async function main() {
  const [operator] = await ethers.getSigners();

  const tokens = await deployToken();
  console.log(`TOKENS => \n${JSON.stringify(transformer(tokens), null, 2)}\n`);

  const pools = await deployPool(tokens.shareV2, tokens.shareV2LP);
  console.log(`POOLS => \n${JSON.stringify(transformer(pools), null, 2)}\n`);

  const { boardroomV2, boardroomV2Store } = await deployBoardroom(
    tokens.cash,
    tokens.shareV2,
    pools.basPoolWrapper
  );
  console.log(
    `BOARDROOM => \n${JSON.stringify(
      transformer({ boardroomV2, boardroomV2Store }),
      null,
      2
    )}\n`
  );

  const migrator = await deployMigrator(
    tokens.shareV1,
    tokens.shareV2,
    tokens.shareV2LP,
    pools.basPool,
    pools.basPoolStore,
    pools.basPoolWrapper,
    boardroomV2
  );
  console.log(
    `MIGRATOR => \n${JSON.stringify(transformer(migrator), null, 2)}\n`
  );

  // dev

  if (network.name === 'rinkeby') {
    let tx;

    tx = await tokens.shareV1
      .connect(operator)
      .approve(migrator.swap.address, ethers.utils.parseEther('100'));
    await wait(ethers, tx.hash, 'shareV1.approve');

    tx = await migrator.swap
      .connect(operator)
      .swap(ethers.utils.parseEther('100'));
    await wait(ethers, tx.hash, 'swap.swap');
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
