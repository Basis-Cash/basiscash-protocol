import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract, ContractFactory, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';

import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UniswapV2Router from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { advanceTimeAndBlock } from '../shared/utilities';

chai.use(solidity);

async function latestBlocktime(provider: Provider): Promise<number> {
  const { timestamp } = await provider.getBlock('latest');
  return timestamp;
}

describe('ContractGuard', () => {
  const ETH = utils.parseEther('1');
  const ZERO = BigNumber.from(0);

  const { provider } = ethers;

  let operator: SignerWithAddress;
  let fraud: SignerWithAddress;

  before('setup accounts', async () => {
    [operator, fraud] = await ethers.getSigners();
  });

  let MockDAI: ContractFactory;
  let Bond: ContractFactory;
  let Cash: ContractFactory;
  let Share: ContractFactory;
  let Oracle: ContractFactory;
  let Treasury: ContractFactory;
  let Boardroom: ContractFactory;
  let Tester: ContractFactory;

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
    MockDAI = await ethers.getContractFactory('MockDai');
    Bond = await ethers.getContractFactory('Bond');
    Cash = await ethers.getContractFactory('Cash');
    Share = await ethers.getContractFactory('Share');
    Oracle = await ethers.getContractFactory('Oracle');
    Treasury = await ethers.getContractFactory('Treasury');
    Boardroom = await ethers.getContractFactory('Boardroom');
    Tester = await ethers.getContractFactory('Tester');
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
  let bond: Contract;
  let cash: Contract;
  let share: Contract;
  let oracle: Contract;
  let treasury: Contract;
  let boardroom: Contract;
  let tester: Contract;

  beforeEach('deploy contracts', async () => {
    dai = await MockDAI.connect(operator).deploy();
    bond = await Bond.connect(operator).deploy();
    cash = await Bond.connect(operator).deploy();
    share = await Bond.connect(operator).deploy();

    await dai.connect(operator).mint(operator.address, ETH);
    await dai.connect(operator).approve(router.address, ETH);
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

    boardroom = await Boardroom.connect(operator).deploy(
      cash.address,
      share.address
    );
    treasury = await Treasury.connect(operator).deploy(
      cash.address,
      bond.address,
      share.address,
      oracle.address,
      boardroom.address,
      await latestBlocktime(provider)
    );
    await oracle.connect(operator).transferOperator(treasury.address);
    await boardroom.connect(operator).transferOperator(treasury.address);

    tester = await Tester.connect(operator).deploy(
      treasury.address,
      boardroom.address
    );

    await advanceTimeAndBlock(provider, Number(await oracle.PERIOD()));
  });

  it('#actionTreasury', async () => {
    await dai.connect(operator).mint(operator.address, ETH);
    await dai.connect(operator).approve(router.address, ETH);
    await cash.connect(operator).transferOperator(treasury.address);
    await bond.connect(operator).transferOperator(treasury.address);

    await router
      .connect(operator)
      .swapExactTokensForTokens(
        ETH.sub(ETH.div(4)),
        ZERO,
        [dai.address, cash.address],
        operator.address,
        (await latestBlocktime(provider)) + 1800
      );
    await advanceTimeAndBlock(
      provider,
      Number(await treasury.allocationDelay())
    );
    await oracle.update();

    await expect(tester.connect(fraud).actionTreasury()).to.revertedWith(
      'ContractGuard: one block, one function'
    );
  });

  it('#actionBoardroom', async () => {
    await share.connect(operator).mint(tester.address, ETH);
    await expect(
      tester.connect(fraud).actionBoardroom(share.address, ETH)
    ).to.revertedWith('ContractGuard: one block, one function');
  });
});
