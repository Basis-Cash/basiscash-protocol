import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { advanceTimeAndBlock, latestBlocktime } from '../../shared/utilities';

chai.use(solidity);

const DAY = 86400;
const ETH = utils.parseEther('1');
const REWARD_AMOUNT = ETH.mul(3000);
const POOL_START_OFFSET = 200;
const POOL_PERIOD = 30 * DAY;

describe('Distribution', () => {
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
    await store.connect(operator).addPool('TokenA Pool', tokenA.address, ETH);
    await store
      .connect(operator)
      .addPool('TokenB Pool', tokenB.address, ETH.mul(2));
    await store
      .connect(operator)
      .addPool('TokenC Pool', tokenC.address, ETH.mul(3));

    const Pool = await ethers.getContractFactory('Distribution');
    pool = await Pool.connect(operator).deploy(reward.address, store.address);

    await store.connect(operator).transferOperator(pool.address);

    await reward
      .connect(operator)
      .mint(pool.address, REWARD_AMOUNT.mul(7).div(4));
  });

  it('notify reward', async () => {
    startTime = (await latestBlocktime(provider)) + POOL_START_OFFSET;
    await pool.connect(operator).setPeriod(startTime, POOL_PERIOD);
    await pool.connect(operator).setReward(REWARD_AMOUNT);
    expect(await pool.rewardRate()).to.eq(REWARD_AMOUNT.div(POOL_PERIOD));
    expect(await pool.periodFinish()).to.eq(startTime + POOL_PERIOD);
  });

  describe('production', () => {
    it('works well', async () => {
      startTime = (await latestBlocktime(provider)) + POOL_START_OFFSET;
      await pool.connect(operator).setPeriod(startTime, POOL_PERIOD);
      await pool.connect(operator).setReward(REWARD_AMOUNT);

      for (const index in tokens) {
        const token = tokens[index];
        await token.connect(operator).mint(whale.address, ETH);
        await token.connect(whale).approve(pool.address, ETH);
        await pool.connect(whale).deposit(index, ETH);
      }

      await pool.connect(operator).massUpdate(
        tokens.map((_, i) => {
          return i;
        })
      );

      for (const index in tokens) {
        expect(await pool.rewardEarned(index, whale.address)).to.eq(0);
        expect(await pool.rewardPerToken(index)).to.eq(0);
      }
      expect(await pool.rewardRateBeforeHalve()).to.eq(0);
    });
  });

  describe('notified', () => {
    beforeEach('notify reward', async () => {
      startTime = (await latestBlocktime(provider)) + POOL_START_OFFSET;
      console.log(startTime);
      await pool.connect(operator).setPeriod(startTime, POOL_PERIOD);
      await pool.connect(operator).setReward(REWARD_AMOUNT);

      for (const token of tokens) {
        await token.connect(operator).mint(whale.address, ETH);
        await token.connect(whale).approve(pool.address, ETH);
      }

      // advance time
      await advanceTimeAndBlock(provider, POOL_START_OFFSET);
    });

    it('deposit', async () => {
      for (const index in tokens) {
        const token = tokens[index];
        await token
          .connect(operator)
          .mint(whale.address, utils.parseEther('111.111'));
        await token
          .connect(whale)
          .approve(pool.address, utils.parseEther('111.111'));
        await pool.connect(whale).deposit(index, utils.parseEther('1.1'));
        await pool.connect(whale).deposit(index, utils.parseEther('10.01'));
        await pool.connect(whale).deposit(index, utils.parseEther('100.001'));
      }
    });

    it('works well', async () => {
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

      for (let i = 0; i < 2; i++) {
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
          await pool.connect(operator).update(index);
        }

        console.log(
          `totalEarning: ${utils.formatEther(
            earning.reduce((acc, earned) => acc.add(earned), BigNumber.from(0))
          )}`
        );
      }

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

    it('migrate', async () => {
      // advance time
      await advanceTimeAndBlock(provider, POOL_START_OFFSET);

      // after startTime

      // deposit

      for (const index in tokens) {
        await pool.connect(whale).deposit(index, ETH);
      }

      let blocktime = await latestBlocktime(provider);
      await advanceTimeAndBlock(
        provider,
        (await pool.periodFinish()).toNumber() - blocktime
      );

      const Pool = await ethers.getContractFactory('Distribution');
      const newPool = await Pool.connect(operator).deploy(
        reward.address,
        store.address
      );

      await store.connect(operator).transferOperator(pool.address);
      await newPool.connect(operator).transferOperator(pool.address);

      await pool.connect(operator).massUpdate(
        tokens.map((t, index) => {
          return index;
        })
      );

      const periodFinishBeforeMigration = await pool.periodFinish();
      await pool.connect(operator).stop();

      blocktime = await latestBlocktime(provider);

      await pool
        .connect(operator)
        .migrate(newPool.address, REWARD_AMOUNT.mul(3).div(4));

      expect(await pool.periodFinish()).to.eq(blocktime);
      expect(await newPool.startTime()).to.eq(blocktime + 2);
    });
  });
});
