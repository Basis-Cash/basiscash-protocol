import { BigNumber, Contract } from 'ethers';
import { ethers } from 'hardhat';
import {
  BASV1_REWARD_RATE,
  BASV2_POOL_FINISH,
  MIGRATION_START_TIME,
} from './config';

import { wait } from './utils';

export async function deployPool(
  shareV2: Contract,
  shareV2LP: Contract
): Promise<{ [name: string]: Contract }> {
  const [operator] = await ethers.getSigners();

  const PoolStore = await ethers.getContractFactory('PoolStore');
  const PoolWrapper = await ethers.getContractFactory('PoolWrapper');
  const BACPool = await ethers.getContractFactory('BASPool');
  const BASPool = await ethers.getContractFactory('BASPool');

  let tx;

  // // bac pool
  // const bacPoolStore = await PoolStore.connect(operator).deploy();
  // await wait(
  //   ethers,
  //   bacPoolStore.deployTransaction.hash,
  //   `deploy.bacPoolStore: ${bacPoolStore.address}`
  // );

  // const bacPool = await BACPool.connect(operator).deploy(
  //   shareV2.address,
  //   bacPoolStore.address,
  //   MIGRATION_START_TIME
  // );
  // await wait(
  //   ethers,
  //   bacPool.deployTransaction.hash,
  //   `deploy.bacPool: ${bacPool.address}`
  // );

  // bas pool
  const basPoolStore = await PoolStore.connect(operator).deploy();
  await wait(
    ethers,
    basPoolStore.deployTransaction.hash,
    `deploy.basPoolStore: ${basPoolStore.address}`
  );

  const basPool = await BASPool.connect(operator).deploy(
    shareV2.address,
    basPoolStore.address,
    MIGRATION_START_TIME
  );
  await wait(
    ethers,
    basPool.deployTransaction.hash,
    `deploy.basPool: ${basPool.address}`
  );

  const basPoolWrapper = await PoolWrapper.connect(operator).deploy(
    basPool.address,
    0
  );
  await wait(
    ethers,
    basPoolWrapper.deployTransaction.hash,
    `deploy.basPoolWrapper: ${basPoolWrapper.address}`
  );

  tx = await basPoolStore
    .connect(operator)
    .addPool(
      'BoardroomV2',
      basPoolWrapper.address,
      ethers.utils.parseEther('1')
    );
  await wait(ethers, tx.hash, `basPoolStore.addPool`);

  tx = await basPoolStore
    .connect(operator)
    .addPool('BASv2-DAI LP Pool', shareV2LP.address, '0');
  await wait(ethers, tx.hash, `basPoolStore.addPool`);

  const period = BASV2_POOL_FINISH - MIGRATION_START_TIME;
  const amount = BigNumber.from(BASV1_REWARD_RATE).mul(period);

  tx = await shareV2.connect(operator).mint(operator.address, amount);
  await wait(ethers, tx.hash, `shareV2.mint`);

  tx = await shareV2.connect(operator).approve(basPool.address, amount);
  await wait(ethers, tx.hash, `shareV2.approve`);

  tx = await basPool.notifyReward(amount, period);
  await wait(ethers, tx.hash, `basPool.notifyReward`);

  // after setup
  tx = await basPoolWrapper
    .connect(operator)
    .approve(basPoolStore.address, ethers.utils.parseEther('1'));
  await wait(ethers, tx.hash, `basPoolWrapper.approve`);

  tx = await basPoolStore
    .connect(operator)
    .deposit(0, basPoolWrapper.address, ethers.utils.parseEther('1'));
  await wait(ethers, tx.hash, `basPoolStore.deposit`);

  tx = await basPoolStore.connect(operator).transferOperator(basPool.address);
  await wait(ethers, tx.hash, `basPoolStore.transferOperator`);

  return {
    // bacPoolStore,
    // bacPool,
    basPoolWrapper,
    basPoolStore,
    basPool,
  };
}
