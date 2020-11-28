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

describe('Oracle', () => {
  const DAY = 86400;
  const ETH = utils.parseEther('1');
  const ZERO = BigNumber.from(0);

  const { provider } = ethers;

  let operator: SignerWithAddress;

  before('setup accounts', async () => {
    [operator] = await ethers.getSigners();
  });

  let Cash: ContractFactory;
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
  let oracle: Contract;

  beforeEach('deploy contracts', async () => {
    dai = await MockDAI.connect(operator).deploy();
    cash = await Cash.connect(operator).deploy();

    await dai.connect(operator).mint(operator.address, ETH.mul(2));
    await dai.connect(operator).approve(router.address, ETH.mul(2));
    await cash.connect(operator).mint(operator.address, ETH);
    await cash.connect(operator).approve(router.address, ETH);

    await router
      .connect(operator)
      .addLiquidity(
        cash.address,
        dai.address,
        ETH,
        ETH,
        ETH,
        ETH,
        operator.address,
        (await latestBlocktime(provider)) + 1800
      );

    oracle = await Oracle.connect(operator).deploy(
      factory.address,
      cash.address,
      dai.address
    );
    await advanceTimeAndBlock(provider, Number(await oracle.PERIOD()));
  });

  it('works correctly', async () => {
    await expect(oracle.update()).to.emit(oracle, 'Updated');
    expect(await oracle.consult(dai.address, ETH)).to.eq(ETH);
    expect(await oracle.consult(cash.address, ETH)).to.eq(ETH);
    expect(
      await oracle.pairFor(factory.address, dai.address, cash.address)
    ).to.eq(await oracle.pair());
  });
});
