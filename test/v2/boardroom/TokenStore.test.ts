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

describe('TokenStore', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let ant: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup', async () => {
    [operator, ant, whale] = await ethers.getSigners();
  });

  let MockDai: ContractFactory;

  before('fetch factories', async () => {
    MockDai = await ethers.getContractFactory('MockDai');
  });

  let store: Contract;
  let token: Contract;

  beforeEach('deploy contract', async () => {
    token = await MockDai.connect(operator).deploy();

    const Store = await ethers.getContractFactory('TokenStore');
    store = await Store.connect(operator).deploy(token.address);

    await token.connect(operator).mint(operator.address, ETH.mul(2));
    await token.connect(operator).mint(whale.address, ETH);
    for await (const approver of [operator, ant, whale]) {
      await token.connect(approver).approve(store.address, ETH.mul(100000)); // infinite
    }
  });

  describe('common', () => {
    it('works well', async () => {
      expect(await store.totalSupply()).to.eq(0);
      expect(await store.balanceOf(operator.address)).to.eq(0);

      await expect(store.connect(operator).deposit(operator.address, ETH))
        .to.emit(store, 'Deposit')
        .withArgs(operator.address, operator.address, ETH);
      await expect(
        store.connect(ant).deposit(ant.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');
      await expect(
        store.connect(whale).deposit(whale.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');

      expect(await store.totalSupply()).to.eq(ETH);
      expect(await store.balanceOf(operator.address)).to.eq(ETH);

      await expect(store.connect(operator).withdraw(operator.address, ETH))
        .to.emit(store, 'Withdraw')
        .withArgs(operator.address, operator.address, ETH);
      await expect(
        store.connect(ant).withdraw(ant.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');
      await expect(
        store.connect(whale).withdraw(whale.address, ETH)
      ).to.revertedWith('operator: caller is not the operator');

      expect(await store.totalSupply()).to.eq(0);
      expect(await store.balanceOf(operator.address)).to.eq(0);

      // emergency
      await store.connect(operator).deposit(ant.address, ETH);
      expect(await store.balanceOf(ant.address)).to.eq(ETH);

      await store.connect(operator).reportEmergency();
      await store.connect(ant).emergencyWithdraw();

      expect(await token.balanceOf(ant.address)).to.eq(ETH);
    });
  });

  describe('gov', () => {
    it('emergency', async () => {
      await store.connect(operator).deposit(ant.address, ETH);
      expect(await store.balanceOf(ant.address)).to.eq(ETH);

      expect(await store.emergency()).to.be.false;
      await expect(store.connect(operator).reportEmergency())
        .to.emit(store, 'EmergencyReported')
        .withArgs(operator.address);

      // in emergency

      await expect(store.connect(ant).emergencyWithdraw())
        .to.emit(store, 'Withdraw')
        .withArgs(ant.address, ant.address, ETH);

      //

      await store.connect(operator).deposit(ant.address, ETH);
      expect(await store.balanceOf(ant.address)).to.eq(ETH);

      expect(await store.emergency()).to.be.true;
      await expect(store.connect(operator).resolveEmergency())
        .to.emit(store, 'EmergencyResolved')
        .withArgs(operator.address);

      // not in emergency

      await expect(store.connect(ant).emergencyWithdraw()).to.revertedWith(
        'TokenStore: not in emergency'
      );

      expect(await store.emergency()).to.be.false;
    });

    it('token setting', async () => {
      const newToken = await MockDai.connect(operator).deploy();
      await newToken.connect(operator).mint(operator.address, ETH);
      await newToken.connect(operator).approve(store.address, ETH);

      await store.connect(operator).deposit(operator.address, ETH);
      await expect(store.connect(operator).setToken(newToken.address))
        .to.emit(newToken, 'Transfer')
        .withArgs(operator.address, store.address, ETH)
        .to.emit(store, 'TokenChanged')
        .withArgs(operator.address, newToken.address, token.address);

      expect(await store.token()).to.eq(newToken.address);
    });
  });
});
