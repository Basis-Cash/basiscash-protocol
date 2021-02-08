import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { wait } from './utils';

export async function deployBoardroom(
  cash: Contract,
  share: Contract,
  poolWrapper: Contract
): Promise<{ [name: string]: Contract }> {
  const [operator] = await ethers.getSigners();

  let tx;

  const TokenStore = await ethers.getContractFactory('TokenStore');
  const BoardroomV2 = await ethers.getContractFactory('BoardroomV2');

  const boardroomV2Store = await TokenStore.connect(operator).deploy(
    share.address
  );
  await wait(
    ethers,
    boardroomV2Store.deployTransaction.hash,
    `deploy.boardroomV2Store: ${boardroomV2Store.address}`
  );

  const boardroomV2 = await BoardroomV2.connect(operator).deploy(
    cash.address,
    share.address,
    boardroomV2Store.address
  );
  await wait(
    ethers,
    boardroomV2.deployTransaction.hash,
    `deploy.boardroomV2: ${boardroomV2.address}`
  );

  tx = await boardroomV2.connect(operator).addRewardPool(poolWrapper.address);
  await wait(ethers, tx.hash, `boardroomV2.addRewardPool`);

  tx = await boardroomV2Store
    .connect(operator)
    .transferOperator(boardroomV2.address);
  await wait(ethers, tx.hash, `boardroomV2Store.transferOperator`);

  return { boardroomV2, boardroomV2Store };
}
