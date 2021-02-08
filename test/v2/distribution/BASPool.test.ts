import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { advanceTimeAndBlock, latestBlocktime } from '../../shared/utilities';

chai.use(solidity);

const DAY = 86400;
const ETH = utils.parseEther('1');
const REWARD_AMOUNT = ETH.mul(36500);
const POOL_START_OFFSET = 60;
const POOL_PERIOD = 365 * DAY;

describe('BASPool', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let ant: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup', async () => {
    [operator, ant, whale] = await ethers.getSigners();
  });

  let startTime: number;
  let pool: Contract;
  let store: Contract;
  let tokenA: Contract;
  let tokenB: Contract;
  let tokenC: Contract;
  let tokens: Contract[];
  let reward: Contract;

  beforeEach('deploy contract', async () => {
    const MockDai = await ethers.getContractFactory('MockDai');
    tokenA = await MockDai.connect(operator).deploy();
    tokenB = await MockDai.connect(operator).deploy();
    tokenC = await MockDai.connect(operator).deploy();
    tokens = [tokenA, tokenB, tokenC];
    reward = await MockDai.connect(operator).deploy();

    const Store = await ethers.getContractFactory('PoolStore');
    store = await Store.connect(operator).deploy();
    await store.connect(operator).addPool('TokenA Pool', tokenA.address, 1);
    await store.connect(operator).addPool('TokenB Pool', tokenB.address, 2);
    await store.connect(operator).addPool('TokenC Pool', tokenC.address, 3);

    startTime = (await latestBlocktime(provider)) + POOL_START_OFFSET;

    const Pool = await ethers.getContractFactory('BASPool');
    pool = await Pool.connect(operator).deploy(
      reward.address,
      store.address,
      startTime
    );

    await store.connect(operator).transferOperator(pool.address);

    await reward.connect(operator).mint(operator.address, REWARD_AMOUNT);
    await reward.connect(operator).approve(pool.address, REWARD_AMOUNT);
  });

  it('notify reward', async () => {
    await pool.connect(operator).notifyReward(REWARD_AMOUNT, POOL_PERIOD);
    expect(await pool.rewardRate()).to.eq(REWARD_AMOUNT.div(POOL_PERIOD));
    expect(await pool.periodFinish()).to.eq(startTime + POOL_PERIOD);
  });

  describe('notified', () => {
    beforeEach('notify reward', async () => {
      await pool.connect(operator).notifyReward(REWARD_AMOUNT, POOL_PERIOD);
      for (const token of tokens) {
        await token.connect(operator).mint(whale.address, ETH);
        await token.connect(whale).approve(pool.address, ETH);
      }
    });

    it('works well', async () => {
      // before startTime
      for (const index in tokens) {
        await expect(pool.connect(ant).deposit(index, ETH)).to.revertedWith(
          'BASPool: not started'
        );
        await expect(pool.connect(whale).deposit(index, ETH)).to.revertedWith(
          'BASPool: not started'
        );
      }

      // advance time
      await advanceTimeAndBlock(provider, POOL_START_OFFSET);

      // after startTime

      // deposit

      for (const index in tokens) {
        const token = tokens[index];
        expect(await token.balanceOf(store.address)).to.eq(0);
        expect(await token.balanceOf(whale.address)).to.eq(ETH);

        await expect(pool.connect(ant).deposit(index, ETH)).to.reverted;
        await expect(pool.connect(whale).deposit(index, ETH))
          .to.emit(pool, 'DepositToken')
          .withArgs(whale.address, index, ETH);

        expect(await token.balanceOf(store.address)).to.eq(ETH);
        expect(await token.balanceOf(whale.address)).to.eq(0);
      }

      // reward

      const blocktime = await latestBlocktime(provider);
      await advanceTimeAndBlock(
        provider,
        (await pool.periodFinish()).toNumber() - blocktime
      );

      const earning: BigNumber[] = [];
      for (const index in tokens) {
        const earned = await pool.rewardEarned(index, whale.address);
        console.log(`${index}: ${utils.formatEther(earned)}`);
        earning.push(earned);
      }

      console.log(
        `totalEarning: ${utils.formatEther(
          earning.reduce((acc, earned) => acc.add(earned), BigNumber.from(0))
        )}`
      );

      // withdraw
      for (const index in tokens) {
        const token = tokens[index];
        expect(await token.balanceOf(store.address)).to.eq(ETH);
        expect(await token.balanceOf(whale.address)).to.eq(0);

        await expect(pool.connect(ant).withdraw(index, ETH)).to.reverted;
        await expect(pool.connect(whale).withdraw(index, ETH))
          .to.emit(pool, 'WithdrawToken')
          .withArgs(whale.address, index, ETH);

        expect(await token.balanceOf(store.address)).to.eq(0);
        expect(await token.balanceOf(whale.address)).to.eq(ETH);
      }
    });
  });
});
