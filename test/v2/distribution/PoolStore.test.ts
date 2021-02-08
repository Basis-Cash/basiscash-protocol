import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import {
  Contract,
  ContractFactory,
  BigNumber,
  utils,
  BigNumberish,
} from 'ethers';
import { Provider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { advanceTimeAndBlock, latestBlocktime } from '../../shared/utilities';

chai.use(solidity);

const ETH = utils.parseEther('1');

describe('PoolStore', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let ant: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup', async () => {
    [operator, ant, whale] = await ethers.getSigners();
  });

  let store: Contract;
  let token: Contract;

  beforeEach('deploy contract', async () => {
    const Store = await ethers.getContractFactory('PoolStore');
    store = await Store.connect(operator).deploy();

    const MockDai = await ethers.getContractFactory('MockDai');
    token = await MockDai.connect(operator).deploy();

    await token.connect(operator).mint(operator.address, ETH);
    await token.connect(operator).mint(whale.address, ETH);
    for await (const approver of [operator, ant, whale]) {
      await token.connect(approver).approve(store.address, ETH.mul(100000)); // infinite
    }
    await store.connect(operator).addPool('Test Pool', token.address, 1);
  });

  describe('common', () => {
    it('works well', async () => {
      expect(await store.poolLength()).to.eq(1);
      expect(await store.nameOf(0)).to.eq('Test Pool');
      expect(await store.tokenOf(0)).to.eq(token.address);
      expect(await store.weightOf(0)).to.eq(1);

      // deposit
      expect(await store.totalSupply(0)).to.eq(0);
      expect(await store.balanceOf(0, operator.address)).to.eq(0);

      await expect(store.connect(operator).deposit(0, operator.address, ETH))
        .to.emit(store, 'Deposit')
        .withArgs(operator.address, operator.address, 0, ETH);
      await expect(
        store.connect(ant).deposit(0, ant.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');
      await expect(
        store.connect(whale).deposit(0, whale.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');

      expect(await store.totalSupply(0)).to.eq(ETH);
      expect(await store.balanceOf(0, operator.address)).to.eq(ETH);

      // withdraw
      await expect(store.connect(operator).withdraw(0, operator.address, ETH))
        .to.emit(store, 'Withdraw')
        .withArgs(operator.address, operator.address, 0, ETH);
      await expect(
        store.connect(ant).withdraw(0, ant.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');
      await expect(
        store.connect(whale).withdraw(0, whale.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');

      expect(await store.totalSupply(0)).to.eq(0);
      expect(await store.balanceOf(0, operator.address)).to.eq(0);

      // emergency
      await store.connect(operator).deposit(0, ant.address, ETH);
      expect(await store.balanceOf(0, ant.address)).to.eq(ETH);

      await store.connect(operator).reportEmergency();
      await store.connect(ant).emergencyWithdraw(0);

      expect(await token.balanceOf(ant.address)).to.eq(ETH);
    });
  });

  describe('gov', () => {
    it('emergency', async () => {
      await store.connect(operator).deposit(0, ant.address, ETH);
      expect(await store.balanceOf(0, ant.address)).to.eq(ETH);

      expect(await store.emergency()).to.be.false;
      await expect(store.connect(operator).reportEmergency())
        .to.emit(store, 'EmergencyReported')
        .withArgs(operator.address);

      // in emergency

      await expect(store.connect(ant).emergencyWithdraw(0))
        .to.emit(store, 'Withdraw')
        .withArgs(ant.address, ant.address, 0, ETH);

      //

      await store.connect(operator).deposit(0, ant.address, ETH);
      expect(await store.balanceOf(0, ant.address)).to.eq(ETH);

      expect(await store.emergency()).to.be.true;
      await expect(store.connect(operator).resolveEmergency())
        .to.emit(store, 'EmergencyResolved')
        .withArgs(operator.address);

      // not in emergency

      await expect(store.connect(ant).emergencyWithdraw(0)).to.revertedWith(
        'PoolStore: not in emergency'
      );

      //

      expect(await store.emergency()).to.be.false;
    });

    it('pool setting', async () => {
      await expect(
        store.connect(operator).addPool('Test Pool 2', token.address, 2)
      )
        .to.emit(store, 'PoolAdded')
        .withArgs(operator.address, 1, 'Test Pool 2', token.address, 2);

      // set pool weight
      expect(await store.totalWeight()).to.eq(3);
      expect(await store.weightOf(1)).to.eq(2);
      await expect(
        store.connect(operator).functions['setPool(uint256,uint256)'](1, 3)
      )
        .to.emit(store, 'PoolWeightChanged')
        .withArgs(operator.address, 1, 2, 3);
      expect(await store.totalWeight()).to.eq(4);
      expect(await store.weightOf(1)).to.eq(3);

      // set pool name
      expect(await store.nameOf(1)).to.eq('Test Pool 2');
      await expect(
        store
          .connect(operator)
          .functions['setPool(uint256,string)'](1, 'Pool Test 2')
      )
        .to.emit(store, 'PoolNameChanged')
        .withArgs(operator.address, 1, 'Test Pool 2', 'Pool Test 2');
      expect(await store.nameOf(1)).to.eq('Pool Test 2');
    });
  });
});
