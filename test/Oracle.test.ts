import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';

import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UniswapV2Router from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Provider } from '@ethersproject/providers';

import { advanceTimeAndBlock } from './shared/utilities';

chai.use(solidity);

async function latestBlocktime(provider: Provider): Promise<number> {
  const { timestamp } = await provider.getBlock('latest');
  return timestamp;
}

async function addLiquidity(
  provider: Provider,
  operator: SignerWithAddress,
  router: Contract,
  tokenA: Contract,
  tokenB: Contract,
  amount: BigNumber
): Promise<void> {
  await router
    .connect(operator)
    .addLiquidity(
      tokenA.address,
      tokenB.address,
      amount,
      amount,
      amount,
      amount,
      operator.address,
      (await latestBlocktime(provider)) + 1800
    );
}

describe('Oracle', () => {
  const MINUTE = 60;
  const DAY = 86400;
  const ETH = utils.parseEther('1');

  const { provider } = ethers;

  let operator: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup accounts', async () => {
    [operator, whale] = await ethers.getSigners();
  });

  let Cash: ContractFactory;
  let Share: ContractFactory;
  let Oracle: ContractFactory;
  let MockDAI: ContractFactory;

  // uniswap
  let Factory = new ContractFactory(
    UniswapV2Factory.abi,
    UniswapV2Factory.bytecode
  );
  let Router = new ContractFactory(
    UniswapV2Router.abi,
    UniswapV2Router.bytecode
  );

  before('fetch contract factories', async () => {
    Cash = await ethers.getContractFactory('Cash');
    Share = await ethers.getContractFactory('Share');
    Oracle = await ethers.getContractFactory('Oracle');
    MockDAI = await ethers.getContractFactory('MockDai');
  });

  let factory: Contract;
  let router: Contract;

  before('deploy uniswap', async () => {
    factory = await Factory.connect(operator).deploy(operator.address);
    router = await Router.connect(operator).deploy(
      factory.address,
      operator.address
    );
  });

  let dai: Contract;
  let cash: Contract;
  let share: Contract;
  let oracle: Contract;
  let oracleStartTime: BigNumber;

  beforeEach('deploy contracts', async () => {
    dai = await MockDAI.connect(operator).deploy();
    cash = await Cash.connect(operator).deploy();
    share = await Share.connect(operator).deploy();

    await dai.connect(operator).mint(operator.address, ETH.mul(2));
    await dai.connect(operator).approve(router.address, ETH.mul(2));
    await cash.connect(operator).mint(operator.address, ETH);
    await cash.connect(operator).approve(router.address, ETH);

    await addLiquidity(provider, operator, router, cash, dai, ETH);

    oracleStartTime = BigNumber.from(await latestBlocktime(provider)).add(DAY);
    oracle = await Oracle.connect(operator).deploy(
      factory.address,
      cash.address,
      dai.address,
      oracleStartTime
    );
  });

  describe('#update', async () => {
    it('should works correctly', async () => {
      await advanceTimeAndBlock(
        provider,
        oracleStartTime.sub(await latestBlocktime(provider)).toNumber() - MINUTE
      );

      // epoch 0
      await expect(oracle.update()).to.revertedWith('Oracle: not opened yet');
      expect(await oracle.nextEpochPoint()).to.eq(oracleStartTime);
      expect(await oracle.epoch()).to.eq(BigNumber.from(0));

      await advanceTimeAndBlock(provider, 2 * MINUTE);

      // epoch 1
      await expect(oracle.update()).to.emit(oracle, 'Updated');
      expect(await oracle.nextEpochPoint()).to.eq(oracleStartTime.add(DAY));
      expect(await oracle.epoch()).to.eq(BigNumber.from(1));
      // check double update
      await expect(oracle.update()).to.revertedWith('Oracle: not opened yet');
    });
  });
});
