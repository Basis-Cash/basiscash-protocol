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

const DAY = 86400;
const ETH = utils.parseEther('1');

const BAC_DAI_V1 = '0xBACBACBACBACBACBACBACBACBACBACBACBACBAC1';
const BAC_DAI_V1_BAL = ETH.mul(10000);
const BAS_DAI_V1 = '0xBACBACBACBACBACBACBACBACBACBACBACBACBAC2';
const BAS_DAI_V1_BAL = ETH.mul(20000);

const FEEDER_START_OFFSET = 60;
const FEEDER_PERIOD = 15 * DAY;

describe('Feeder', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let ant: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup', async () => {
    [operator, ant, whale] = await ethers.getSigners();
  });

  let MockDai: ContractFactory;
  let MockPool: ContractFactory;
  let MockBoardroom: ContractFactory;
  let Feeder: ContractFactory;
  let ShareV1: ContractFactory;
  let ShareV2: ContractFactory;
  let PoolStore: ContractFactory;

  before('fetch contract factories', async () => {
    MockDai = await ethers.getContractFactory('MockDai');
    MockPool = await ethers.getContractFactory('MockPool');
    MockBoardroom = await ethers.getContractFactory('MockBoardroom');
    Feeder = await ethers.getContractFactory('Feeder');
    ShareV1 = await ethers.getContractFactory('Share');
    ShareV2 = await ethers.getContractFactory('ShareV2');
    PoolStore = await ethers.getContractFactory('PoolStore');
  });

  let feeder: Contract;
  let shareV1: Contract;
  let shareV2: Contract;
  let shareV2LP: Contract;
  let shareV2Pool: Contract;
  let shareV2PoolStore: Contract;
  let boardroom: Contract;

  beforeEach('deploy contracts', async () => {
    shareV1 = await ShareV1.connect(operator).deploy();
    await shareV1.connect(operator).mint(operator.address, ETH.mul(99));
    await shareV1.connect(operator).mint(BAC_DAI_V1, BAC_DAI_V1_BAL);
    await shareV1.connect(operator).mint(BAS_DAI_V1, BAS_DAI_V1_BAL);

    shareV2 = await ShareV2.connect(operator).deploy();
    shareV2LP = await MockDai.connect(operator).deploy();

    shareV2Pool = await MockPool.connect(operator).deploy();
    await shareV2Pool.connect(operator).addPool(shareV2.address);
    await shareV2Pool.connect(operator).addPool(shareV2LP.address);

    shareV2PoolStore = await PoolStore.connect(operator).deploy();
    await shareV2PoolStore
      .connect(operator)
      .addPool('BASv2 Pool', shareV2.address, 1);
    await shareV2PoolStore
      .connect(operator)
      .addPool('BASv2 LP Pool', shareV2LP.address, 0);

    boardroom = await MockBoardroom.connect(operator).deploy();

    const blocktime = await latestBlocktime(provider);
    feeder = await Feeder.connect(operator).deploy(
      shareV1.address,
      shareV2.address,
      shareV2LP.address,
      BAC_DAI_V1,
      BAS_DAI_V1,
      shareV2Pool.address,
      shareV2PoolStore.address,
      boardroom.address,
      blocktime + FEEDER_START_OFFSET,
      FEEDER_PERIOD
    );

    await shareV2PoolStore.connect(operator).transferOwnership(feeder.address);
  });

  it('works well', async () => {
    // before startTime

    await expect(feeder.connect(operator).feed()).to.revertedWith(
      'Feeder: not started'
    );

    // advance time
    await advanceTimeAndBlock(provider, FEEDER_START_OFFSET);

    // after startTime
    // before expire

    let prevWeightA = BigNumber.from(0);
    let prevWeightB = ETH;

    while ((await shareV2.totalSupply()).lte(ETH.mul(100))) {
      const v1Supply = await shareV1.balanceOf(operator.address);
      const v2Supply = await shareV2.totalSupply();

      const expectedWeightA = v2Supply.mul(ETH).div(v1Supply);
      const expectedWeightB = ETH.sub(expectedWeightA);

      await expect(feeder.connect(operator).feed())
        .to.emit(shareV2PoolStore, 'PoolWeightChanged')
        .to.emit(shareV2PoolStore, 'PoolWeightChanged')
        .to.emit(shareV2Pool, 'Updated')
        .withArgs(0)
        .to.emit(shareV2Pool, 'Updated')
        .withArgs(1)
        .to.emit(boardroom, 'RewardCollected')
        .withArgs(feeder.address, feeder.address, feeder.address, 0);

      expect(await shareV2PoolStore.weightOf(0)).to.eq(expectedWeightB);
      expect(await shareV2PoolStore.weightOf(1)).to.eq(expectedWeightA);

      prevWeightA = expectedWeightA;
      prevWeightB = expectedWeightB;

      await shareV2.connect(operator).mint(operator.address, ETH);
    }

    // advance time
    await advanceTimeAndBlock(provider, FEEDER_PERIOD);

    // after expire

    await expect(feeder.connect(operator).feed()).to.revertedWith(
      'Feeder: finished'
    );

    await feeder.connect(operator).finalize();
    expect(await shareV2.owner()).to.eq(operator.address);
  });
});
