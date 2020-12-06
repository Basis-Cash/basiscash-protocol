import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

chai.use(solidity);

describe('Boardroom', () => {
  const DAY = 86400;
  const ETH = utils.parseEther('1');
  const ZERO = BigNumber.from(0);
  const STAKE_AMOUNT = ETH.mul(5000);
  const SEIGNIORAGE_AMOUNT = ETH.mul(10000);

  const { provider } = ethers;

  let operator: SignerWithAddress;
  let whale: SignerWithAddress;
  let abuser: SignerWithAddress;

  before('provider & accounts setting', async () => {
    [operator, whale, abuser] = await ethers.getSigners();
  });

  let Cash: ContractFactory;
  let Share: ContractFactory;
  let Boardroom: ContractFactory;

  before('fetch contract factories', async () => {
    Cash = await ethers.getContractFactory('Cash');
    Share = await ethers.getContractFactory('Share');
    Boardroom = await ethers.getContractFactory('Boardroom');
  });

  let cash: Contract;
  let share: Contract;
  let boardroom: Contract;

  beforeEach('deploy contracts', async () => {
    cash = await Cash.connect(operator).deploy();
    share = await Share.connect(operator).deploy();
    boardroom = await Boardroom.connect(operator).deploy(
      cash.address,
      share.address
    );
  });

  describe('#stake', () => {
    it('should work correctly', async () => {
      await Promise.all([
        share.connect(operator).mint(whale.address, STAKE_AMOUNT),
        share.connect(whale).approve(boardroom.address, STAKE_AMOUNT),
      ]);

      await expect(boardroom.connect(whale).stake(STAKE_AMOUNT))
        .to.emit(boardroom, 'Staked')
        .withArgs(whale.address, STAKE_AMOUNT);
        
      const latestSnapshotIndex = await boardroom.latestSnapshotIndex();
        
      expect(await boardroom.balanceOf(whale.address)).to.eq(STAKE_AMOUNT);

      expect(await boardroom.getLastSnapshotIndexOf(whale.address)).to.eq(
        latestSnapshotIndex
      );
    });

    it('should fail when user tries to stake with zero amount', async () => {
      await expect(boardroom.connect(whale).stake(ZERO)).to.revertedWith(
        'Boardroom: Cannot stake 0'
      );
    });
  });

  describe('#withdraw', () => {
    beforeEach('stake', async () => {
      await Promise.all([
        share.connect(operator).mint(whale.address, STAKE_AMOUNT),
        share.connect(whale).approve(boardroom.address, STAKE_AMOUNT),
      ]);
      await boardroom.connect(whale).stake(STAKE_AMOUNT);
    });

    it('should work correctly', async () => {
      await expect(boardroom.connect(whale).withdraw(STAKE_AMOUNT))
        .to.emit(boardroom, 'Withdrawn')
        .withArgs(whale.address, STAKE_AMOUNT);

      expect(await share.balanceOf(whale.address)).to.eq(STAKE_AMOUNT);
      expect(await boardroom.balanceOf(whale.address)).to.eq(ZERO);
    });

    it('should fail when user tries to withdraw with zero amount', async () => {
      await expect(boardroom.connect(whale).withdraw(ZERO)).to.revertedWith(
        'Boardroom: Cannot withdraw 0'
      );
    });

    it('should fail when user tries to withdraw more than staked amount', async () => {
      await expect(
        boardroom.connect(whale).withdraw(STAKE_AMOUNT.add(1))
      ).to.revertedWith(
        'Boardroom: withdraw request greater than staked amount'
      );
    });

    it('should fail when non-director tries to withdraw', async () => {
      await expect(boardroom.connect(abuser).withdraw(ZERO)).to.revertedWith(
        'Boardroom: The director does not exist'
      );
    });
  });

  describe('#exit', async () => {
    beforeEach('stake', async () => {
      await Promise.all([
        share.connect(operator).mint(whale.address, STAKE_AMOUNT),
        share.connect(whale).approve(boardroom.address, STAKE_AMOUNT),
      ]);
      await boardroom.connect(whale).stake(STAKE_AMOUNT);
    });

    it('should work correctly', async () => {
      await expect(boardroom.connect(whale).exit())
        .to.emit(boardroom, 'Withdrawn')
        .withArgs(whale.address, STAKE_AMOUNT);

      expect(await share.balanceOf(whale.address)).to.eq(STAKE_AMOUNT);
      expect(await boardroom.balanceOf(whale.address)).to.eq(ZERO);
    });
  });

  describe('#allocateSeigniorage', () => {
    beforeEach('stake', async () => {
      await Promise.all([
        share.connect(operator).mint(whale.address, STAKE_AMOUNT),
        share.connect(whale).approve(boardroom.address, STAKE_AMOUNT),
      ]);
      await boardroom.connect(whale).stake(STAKE_AMOUNT);
    });

    it('should allocate seigniorage to stakers', async () => {
      await cash.connect(operator).mint(operator.address, SEIGNIORAGE_AMOUNT);
      await cash
        .connect(operator)
        .approve(boardroom.address, SEIGNIORAGE_AMOUNT);

      await expect(
        boardroom.connect(operator).allocateSeigniorage(SEIGNIORAGE_AMOUNT)
      )
        .to.emit(boardroom, 'RewardAdded')
        .withArgs(operator.address, SEIGNIORAGE_AMOUNT);

      expect(await boardroom.earned(whale.address)).to.eq(
        SEIGNIORAGE_AMOUNT
      );
    });

    it('should fail when user tries to allocate with zero amount', async () => {
      await expect(
        boardroom.connect(operator).allocateSeigniorage(ZERO)
      ).to.revertedWith('Boardroom: Cannot allocate 0');
    });

    it('should fail when non-operator tries to allocate seigniorage', async () => {
      await expect(
        boardroom.connect(abuser).allocateSeigniorage(ZERO)
      ).to.revertedWith('operator: caller is not the operator');
    });
  });

  describe('#claimDividends', () => {
    beforeEach('stake', async () => {
      await Promise.all([
        share.connect(operator).mint(whale.address, STAKE_AMOUNT),
        share.connect(whale).approve(boardroom.address, STAKE_AMOUNT),

        share.connect(operator).mint(abuser.address, STAKE_AMOUNT),                    
        share.connect(abuser).approve(boardroom.address, STAKE_AMOUNT), 
      ]);
      await boardroom.connect(whale).stake(STAKE_AMOUNT);
    });

    it('should claim devidends', async () => {
      await cash.connect(operator).mint(operator.address, SEIGNIORAGE_AMOUNT);
      await cash
        .connect(operator)
        .approve(boardroom.address, SEIGNIORAGE_AMOUNT);
      await boardroom.connect(operator).allocateSeigniorage(SEIGNIORAGE_AMOUNT);

      await expect(boardroom.connect(whale).claimReward())
        .to.emit(boardroom, 'RewardPaid')
        .withArgs(whale.address, SEIGNIORAGE_AMOUNT);
      expect(await boardroom.balanceOf(whale.address)).to.eq(STAKE_AMOUNT);
    });

   it('should claim devidends correctly even after other person stakes after snapshot', async () => {
      await cash.connect(operator).mint(operator.address, SEIGNIORAGE_AMOUNT);
      await cash
        .connect(operator)
        .approve(boardroom.address, SEIGNIORAGE_AMOUNT);
      await boardroom.connect(operator).allocateSeigniorage(SEIGNIORAGE_AMOUNT);

      await boardroom.connect(abuser).stake(STAKE_AMOUNT);        

      await expect(boardroom.connect(whale).claimReward())
        .to.emit(boardroom, 'RewardPaid')
        .withArgs(whale.address, SEIGNIORAGE_AMOUNT);
      expect(await boardroom.balanceOf(whale.address)).to.eq(STAKE_AMOUNT);
    });      
      
  });

    
});
