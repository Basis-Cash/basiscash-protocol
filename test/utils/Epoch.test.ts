import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { advanceTimeAndBlock, latestBlocktime } from '../shared/utilities';

chai.use(solidity);

describe('Epoch', () => {
  const DAY = 86400;
  const ETH = utils.parseEther('1');
  const ZERO = BigNumber.from(0);

  const { provider } = ethers;

  let operator: SignerWithAddress;

  before('provider & accounts setting', async () => {
    [operator] = await ethers.getSigners();
  });

  let Epoch: ContractFactory;

  before('fetch contract factories', async () => {
    Epoch = await ethers.getContractFactory('EpochTester');
  });

  let epoch: Contract;

  beforeEach('deploy contracts', async () => {
    epoch = await Epoch.connect(operator).deploy(
      DAY,
      (await latestBlocktime(provider)) + DAY,
      0
    );
  });

  it('#getLastEpoch', async () => {
    expect(await epoch.getLastEpoch()).to.eq(0);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getLastEpoch()).to.eq(0);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getLastEpoch()).to.eq(1);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getLastEpoch()).to.eq(2);
    await advanceTimeAndBlock(provider, DAY);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getLastEpoch()).to.eq(4);
  });

  it('#getCurrentEpoch', async () => {
    expect(await epoch.getCurrentEpoch()).to.eq(0);
    await advanceTimeAndBlock(provider, DAY);
    expect(await epoch.getCurrentEpoch()).to.eq(0);
    await advanceTimeAndBlock(provider, DAY);
    expect(await epoch.getCurrentEpoch()).to.eq(1);
    await advanceTimeAndBlock(provider, DAY);
    expect(await epoch.getCurrentEpoch()).to.eq(2);
    await advanceTimeAndBlock(provider, DAY);
    await advanceTimeAndBlock(provider, DAY);
    expect(await epoch.getCurrentEpoch()).to.eq(4);
  });

  it('#getNextEpoch', async () => {
    expect(await epoch.getNextEpoch()).to.eq(0);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getNextEpoch()).to.eq(1);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getNextEpoch()).to.eq(2);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getNextEpoch()).to.eq(3);
    await advanceTimeAndBlock(provider, DAY);
    await advanceTimeAndBlock(provider, DAY);
    await epoch.testCheckEpoch();
    expect(await epoch.getNextEpoch()).to.eq(5);
  });

  describe('before startTime', () => {
    it('check status', async () => {
      expect(await epoch.getLastEpoch()).to.eq(0);
      expect(await epoch.getCurrentEpoch()).to.eq(0);
      expect(await epoch.getNextEpoch()).to.eq(0);
      expect(await epoch.nextEpochPoint()).to.eq(await epoch.getStartTime());
    });

    it('should fail', async () => {
      await expect(epoch.testCheckStartTime()).to.revertedWith(
        'Epoch: not started yet'
      );
      await expect(epoch.testCheckEpoch()).to.revertedWith(
        'Epoch: not started yet'
      );
    });
  });
});
