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
import { Token } from '@uniswap/sdk';

chai.use(solidity);

const ETH = utils.parseEther('1');

describe('BoardroomV2', () => {
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

  let cash: Contract;
  let share: Contract;
  let store: Contract;
  let sharePool: Contract;
  let shareErrPool: Contract;
  let pools: Contract[];
  let boardroom: Contract;

  beforeEach('deploy contracts', async () => {
    cash = await MockDai.connect(operator).deploy();
    share = await MockDai.connect(operator).deploy();

    const Store = await ethers.getContractFactory('TokenStore');
    store = await Store.connect(operator).deploy(share.address);

    const Pool = await ethers.getContractFactory('MockBoardroomPool');
    sharePool = await Pool.connect(operator).deploy(
      share.address,
      ETH,
      2,
      false
    );
    shareErrPool = await Pool.connect(operator).deploy(
      share.address,
      ETH,
      2,
      true
    );
    pools = [sharePool, shareErrPool];

    const Boardroom = await ethers.getContractFactory('BoardroomV2');
    boardroom = await Boardroom.connect(operator).deploy(
      cash.address,
      share.address,
      store.address
    );

    for await (const approver of [operator, ant, whale]) {
      await share.connect(approver).approve(boardroom.address, ETH.mul(10000));
    }
    await store.connect(operator).transferOperator(boardroom.address);
  });

  it('can deposit & withdraw without pools', async () => {
    await expect(boardroom.connect(operator).deposit(ETH))
      .to.emit(boardroom, 'DepositShare')
      .withArgs(operator.address, ETH);
    await expect(boardroom.connect(operator).withdraw(ETH))
      .to.emit(boardroom, 'WithdrawShare')
      .withArgs(operator.address, ETH);
  });

  describe('common', () => {
    beforeEach('add pools', async () => {
      for await (const pool of pools) {
        await boardroom.connect(operator).addRewardPool(pool.address);
      }
      await share.connect(operator).mint(sharePool.address, ETH);
      await share.connect(operator).mint(shareErrPool.address, ETH);

      await expect(boardroom.connect(operator).deposit(ETH))
        .to.emit(boardroom, 'DepositShare')
        .withArgs(operator.address, ETH);
    });

    describe('works well', () => {
      it('without rewards', async () => {
        await expect(boardroom.connect(operator).deposit(ETH))
          .to.emit(boardroom, 'DepositShare')
          .withArgs(operator.address, ETH)
          .to.emit(boardroom, 'RewardCollected')
          .withArgs(
            operator.address,
            sharePool.address,
            share.address,
            ETH.div(2)
          )
          .to.emit(boardroom, 'RewardCollectionFailedWithReason')
          .withArgs(operator.address, shareErrPool.address, 'Pool: nonono');

        await expect(boardroom.connect(operator).withdraw(ETH))
          .to.emit(boardroom, 'WithdrawShare')
          .withArgs(operator.address, ETH)
          .to.emit(boardroom, 'RewardCollected')
          .withArgs(
            operator.address,
            sharePool.address,
            share.address,
            ETH.div(2)
          )
          .to.emit(boardroom, 'RewardCollectionFailedWithReason')
          .withArgs(operator.address, shareErrPool.address, 'Pool: nonono');

        await expect(boardroom.connect(operator).claimReward())
          .to.emit(boardroom, 'RewardClaimed')
          .withArgs(operator.address, share.address, ETH);
      });
    });
  });
});
