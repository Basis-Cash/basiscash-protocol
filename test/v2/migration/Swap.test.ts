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
const ETH = ethers.utils.parseEther('1');
const SWAP_START_OFFSET = 60;
const SWAP_PERIOD = 15 * DAY;

describe('Swap', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let ant: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup', async () => {
    [operator, ant, whale] = await ethers.getSigners();
  });

  let ShareV1: ContractFactory;
  let ShareV2: ContractFactory;
  let Swap: ContractFactory;
  let MockFeeder: ContractFactory;

  before('fetch contract factories', async () => {
    ShareV1 = await ethers.getContractFactory('Share');
    ShareV2 = await ethers.getContractFactory('ShareV2');
    Swap = await ethers.getContractFactory('Swap');
    MockFeeder = await ethers.getContractFactory('MockFeeder');
  });

  let shareV1: Contract;
  let shareV2: Contract;
  let feeder: Contract;
  let swap: Contract;

  beforeEach('deploy contracts', async () => {
    shareV1 = await ShareV1.connect(operator).deploy();
    await shareV1.connect(operator).mint(whale.address, ETH.mul(2));

    shareV2 = await ShareV2.connect(operator).deploy();
    feeder = await MockFeeder.connect(operator).deploy();

    const blocktime = await latestBlocktime(provider);
    swap = await Swap.connect(operator).deploy(
      shareV1.address,
      shareV2.address,
      feeder.address,
      blocktime + SWAP_START_OFFSET,
      SWAP_PERIOD
    );

    // set swap contract as a operator
    await shareV1.connect(ant).approve(swap.address, ETH);
    await shareV1.connect(whale).approve(swap.address, ETH);
    await shareV2.connect(operator).transferOperator(swap.address);
  });

  it('works well', async () => {
    // before startTime

    await expect(swap.connect(ant).swap(ETH)).to.revertedWith(
      'Swap: not started'
    );
    await expect(swap.connect(whale).swap(ETH)).to.revertedWith(
      'Swap: not started'
    );

    // advance time
    await advanceTimeAndBlock(provider, SWAP_START_OFFSET);

    // after startTime
    // before expire

    await expect(swap.connect(ant).swap(ETH)).to.reverted;
    expect(await swap.connect(whale).swap(ETH))
      .to.emit(swap, 'TokenSwapped')
      .withArgs(whale.address, shareV1.address, shareV2.address, ETH)
      .to.emit(feeder, 'Feeded')
      .withArgs(swap.address, 0, 0);
    expect(await shareV2.balanceOf(whale.address)).to.eq(ETH);
    expect(await shareV1.balanceOf(swap.address)).to.eq(ETH);

    // advance time
    await advanceTimeAndBlock(provider, SWAP_PERIOD);

    // after expire

    await expect(swap.connect(ant).swap(ETH)).to.revertedWith('Swap: finished');
    await expect(swap.connect(whale).swap(ETH)).to.revertedWith(
      'Swap: finished'
    );
  });
});
