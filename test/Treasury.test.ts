import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { advanceTimeAndBlock } from './shared/utilities';

import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UniswapV2Router from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

chai.use(solidity);

const DAY = 86400;
const ETH = utils.parseEther('1');
const ZERO = BigNumber.from(0);
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

async function latestBlocktime(provider: Provider): Promise<number> {
  const { timestamp } = await provider.getBlock('latest');
  return timestamp;
}

async function swapToken(
  provider: Provider,
  router: Contract,
  account: SignerWithAddress,
  amount: BigNumber,
  tokenA: Contract,
  tokenB: Contract
): Promise<void> {
  await router
    .connect(account)
    .swapExactTokensForTokens(
      amount,
      ZERO,
      [tokenA.address, tokenB.address],
      account.address,
      (await latestBlocktime(provider)) + 1800
    );
}

describe('Treasury', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let ant: SignerWithAddress;

  before('provider & accounts setting', async () => {
    [operator, ant] = await ethers.getSigners();
  });

  // core
  let Bond: ContractFactory;
  let Cash: ContractFactory;
  let Share: ContractFactory;
  let Treasury: ContractFactory;
  let Boardroom: ContractFactory;
  let MockDAI: ContractFactory;
  let Oracle: ContractFactory;

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
    Bond = await ethers.getContractFactory('Bond');
    Cash = await ethers.getContractFactory('Cash');
    Share = await ethers.getContractFactory('Share');
    MockDAI = await ethers.getContractFactory('MockDai');
    Treasury = await ethers.getContractFactory('Treasury');
    Boardroom = await ethers.getContractFactory('Boardroom');
    Oracle = await ethers.getContractFactory('Oracle');
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

  let oraclePeriod: number;
  let allocationDelay: number;

  beforeEach('deploy contracts', async () => {
    dai = await MockDAI.connect(operator).deploy();
    bond = await Bond.connect(operator).deploy();
    cash = await Cash.connect(operator).deploy();
    share = await Share.connect(operator).deploy();

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
    oraclePeriod = Number(await oracle.PERIOD());
    await advanceTimeAndBlock(provider, oraclePeriod);
    await oracle.update();

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
    allocationDelay = Number(await treasury.allocationDelay());
  });

  describe('#migrate', () => {
    let newTreasury: Contract;

    beforeEach('deploy new treasury', async () => {
      newTreasury = await Treasury.connect(operator).deploy(
        cash.address,
        bond.address,
        share.address,
        oracle.address,
        boardroom.address,
        await latestBlocktime(provider)
      );

      for await (const token of [cash, bond, share]) {
        await token.connect(operator).mint(treasury.address, ETH);
        await token.connect(operator).transferOperator(treasury.address);
        await token.connect(operator).transferOwnership(treasury.address);
      }
    });

    it('should works correctly', async () => {
      await expect(treasury.connect(operator).migrate(newTreasury.address))
        .to.emit(treasury, 'Migration')
        .withArgs(newTreasury.address);

      for await (const token of [cash, bond, share]) {
        expect(await token.balanceOf(newTreasury.address)).to.eq(ETH);
        expect(await token.owner()).to.eq(newTreasury.address);
        expect(await token.operator()).to.eq(newTreasury.address);
      }
    });

    it('should fail if already migrated', async () => {
      await treasury.connect(operator).migrate(newTreasury.address);
      await expect(
        treasury.connect(operator).migrate(newTreasury.address)
      ).to.revertedWith('Treasury: this contract has been migrated');
    });
  });

  describe('#initialize', () => {
    let newTreasury: Contract;

    beforeEach('deploy new treasury', async () => {
      newTreasury = await Treasury.connect(operator).deploy(
        cash.address,
        bond.address,
        share.address,
        oracle.address,
        boardroom.address,
        await latestBlocktime(provider)
      );

      for await (const token of [cash, bond, share]) {
        await token.connect(operator).mint(treasury.address, ETH);
        await token.connect(operator).transferOperator(treasury.address);
        await token.connect(operator).transferOwnership(treasury.address);
      }
      await oracle.connect(operator).transferOperator(newTreasury.address);
      await oracle.connect(operator).transferOwnership(newTreasury.address);
      await boardroom.connect(operator).transferOperator(newTreasury.address);
      await boardroom.connect(operator).transferOwnership(newTreasury.address);
    });

    it('should works correctly', async () => {
      await treasury.connect(operator).migrate(newTreasury.address);

      await expect(newTreasury.initialize())
        .to.emit(newTreasury, 'Initialized')
        .to.emit(cash, 'Transfer')
        .withArgs(newTreasury.address, ZERO_ADDR, ETH)
        .to.emit(cash, 'Transfer')
        .withArgs(ZERO_ADDR, newTreasury.address, ETH.mul(1001));

      expect(await newTreasury.getReserve()).to.eq(ETH.mul(1001));
    });

    it("should fail if newTreasury is not the operator of tokens' contract", async () => {
      await expect(newTreasury.initialize()).to.revertedWith(
        'Treasury: this contract is not the operator of the basis cash contract'
      );
    });

    it('should fail if abuser tries to initialize twice', async () => {
      await treasury.connect(operator).migrate(newTreasury.address);
      await newTreasury.initialize();
      await expect(newTreasury.initialize()).to.revertedWith(
        'Treasury: this contract already has been initialized'
      );
    });
  });

  describe('#allocateSeigniorage', () => {
    const swapAmount = ETH.sub(ETH.div(4));

    beforeEach('distribute tokens', async () => {
      await Promise.all([
        dai.connect(operator).mint(ant.address, swapAmount),
        dai.connect(ant).approve(router.address, swapAmount),
      ]);
    });

    it('should work correctly', async () => {
      for await (const contract of [cash, bond, share, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }

      await swapToken(provider, router, ant, swapAmount, dai, cash);
      await advanceTimeAndBlock(provider, allocationDelay);

      const tx = await treasury.allocateSeigniorage();

      const cashPrice = await oracle.consult(cash.address, ETH);
      const treasuryReserve = await treasury.getReserve();
      const cashSupply = (await cash.totalSupply()).sub(treasuryReserve);
      const expectedSeigniorage = cashSupply.mul(cashPrice.sub(ETH)).div(ETH);

      const blocktime = await latestBlocktime(provider);
      await expect(new Promise((resolve) => resolve(tx)))
        .to.emit(treasury, 'TreasuryFunded')
        .withArgs(blocktime, expectedSeigniorage);

      expect(await cash.balanceOf(treasury.address)).to.eq(expectedSeigniorage);
    });

    it("should funded to boardroom when contract's seigniorage budget exceeds depletion floor", async () => {
      await cash.connect(operator).mint(operator.address, ETH.mul(1000));
      await share.connect(operator).mint(ant.address, ETH);

      for await (const contract of [cash, bond, share, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }

      await swapToken(provider, router, ant, swapAmount, dai, cash);
      await advanceTimeAndBlock(provider, allocationDelay);
      await oracle.update();

      await share.connect(ant).approve(boardroom.address, ETH);
      await boardroom.connect(ant).stake(ETH);
      await treasury.allocateSeigniorage();
      await advanceTimeAndBlock(provider, allocationDelay);
      await oracle.update();

      const cashPrice = await oracle.consult(cash.address, ETH);
      const treasuryReserve = await treasury.getReserve();
      const cashSupply = (await cash.totalSupply()).sub(treasuryReserve);
      const expectedSeigniorage = cashSupply.mul(cashPrice.sub(ETH)).div(ETH);

      const tx = await treasury.allocateSeigniorage();
      const blocktime = await latestBlocktime(provider);
      await expect(new Promise((resolve) => resolve(tx)))
        .to.emit(treasury, 'BoardroomFunded')
        .withArgs(blocktime, expectedSeigniorage);

      expect(await cash.balanceOf(boardroom.address)).to.eq(
        expectedSeigniorage
      );
    });

    it('should fail if treasury is not the operator of cash contract', async () => {
      for await (const contract of [bond, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
      await expect(treasury.allocateSeigniorage()).to.revertedWith(
        'Treasury: this contract is not the operator of the basis cash contract'
      );
    });

    it('should fail if treasury is not the operator of bond contract', async () => {
      for await (const contract of [cash, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
      await expect(treasury.allocateSeigniorage()).to.revertedWith(
        'Treasury: this contract is not the operator of the basis bond contract'
      );
    });

    it('should fail if treasury is not the operator of boardroom contract', async () => {
      for await (const contract of [cash, bond, oracle]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
      await expect(treasury.allocateSeigniorage()).to.revertedWith(
        'Treasury: this contract is not the operator of the boardroom contract'
      );
    });
    it('should fail if treasury is not the operator of oracle contract', async () => {
      for await (const contract of [cash, bond, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
      await expect(treasury.allocateSeigniorage()).to.revertedWith(
        'Treasury: this contract is not the operator of the oracle contract'
      );
    });

    it('should fail when cash price is below $1+ε', async () => {
      for await (const contract of [cash, bond, share, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
      await advanceTimeAndBlock(provider, allocationDelay);
      await expect(treasury.allocateSeigniorage()).to.revertedWith(
        'Treasury: there is no seigniorage to be allocated'
      );
    });
  });

  describe('#buyBonds', () => {
    const purchaseAmount = ETH.mul(10);
    const swapAmount = ETH.div(4);

    beforeEach('distribute tokens', async () => {
      await cash
        .connect(operator)
        .mint(ant.address, swapAmount.add(purchaseAmount));
      for await (const contract of [cash, bond, share, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
    });

    it('should always fail', async () => {
      await dai.connect(operator).mint(ant.address, swapAmount);
      await dai.connect(ant).approve(router.address, swapAmount);

      await swapToken(provider, router, ant, swapAmount, dai, cash);
      await advanceTimeAndBlock(provider, oraclePeriod);
      await oracle.update();

      const price = await oracle.consult(cash.address, ETH);
      const antBalance = await cash.balanceOf(ant.address);

      await cash.connect(ant).approve(treasury.address, antBalance);
      await expect(
        treasury.connect(ant).buyBonds(ZERO, price)
      ).to.revertedWith('Treasury: can no longer purchase bonds');
    });

  });

  describe('#redeemBonds', () => {
    const swapAmount = ETH.sub(ETH.div(4));

    beforeEach('buy bonds', async () => {
      await Promise.all([
        dai.connect(operator).mint(ant.address, swapAmount),
        dai.connect(ant).approve(router.address, swapAmount),
      ]);
      await cash.connect(operator).mint(operator.address, ETH.mul(10));
      await bond.connect(operator).mint(operator.address, ETH.mul(100));
      for await (const contract of [cash, bond, share, oracle, boardroom]) {
        await contract.connect(operator).transferOperator(treasury.address);
      }
    });

    it('should work correctly', async () => {
      await swapToken(provider, router, ant, swapAmount, dai, cash);
      await advanceTimeAndBlock(provider, allocationDelay);
      await oracle.update();
      await treasury.connect(operator).allocateSeigniorage();
      await cash
        .connect(ant)
        .transfer(treasury.address, await cash.balanceOf(ant.address));

      const price = await treasury.getCashPrice();
      const redeemAmount = await cash.balanceOf(treasury.address);

      await bond.connect(operator).transfer(ant.address, redeemAmount);
      await bond.connect(ant).approve(treasury.address, redeemAmount);
      await expect(treasury.connect(ant).redeemBonds(redeemAmount, price))
        .to.emit(treasury, 'RedeemedBonds')
        .withArgs(ant.address, redeemAmount);

      expect(await bond.balanceOf(ant.address)).to.eq(ZERO); // 1:1
      expect(await cash.balanceOf(ant.address)).to.eq(redeemAmount);
    });

    it("should drain over seigniorage and even contract's budget", async () => {
      await swapToken(provider, router, ant, swapAmount, dai, cash);
      await advanceTimeAndBlock(provider, allocationDelay);
      await oracle.update();
      await treasury.connect(operator).allocateSeigniorage();
      await cash.connect(operator).transfer(treasury.address, ETH);

      const treasuryBalance = await cash.balanceOf(treasury.address);
      const cashBalance = await cash.balanceOf(ant.address);
      const redeemAmount = treasuryBalance.add(cashBalance);

      await cash.connect(ant).transfer(treasury.address, cashBalance);
      await bond.connect(operator).transfer(ant.address, redeemAmount);
      await bond.connect(ant).approve(treasury.address, redeemAmount);
      await treasury
        .connect(ant)
        .redeemBonds(redeemAmount, await treasury.getCashPrice());

      expect(await bond.balanceOf(ant.address)).to.eq(ZERO);
      expect(await cash.balanceOf(ant.address)).to.eq(redeemAmount); // 1:1
    });

    it('should fail if price does not match with current price', async () => {
      await swapToken(provider, router, ant, swapAmount.div(2), dai, cash);
      await advanceTimeAndBlock(provider, allocationDelay);
      await oracle.update();
      await treasury.connect(operator).allocateSeigniorage();
      await cash
        .connect(ant)
        .transfer(treasury.address, await cash.balanceOf(ant.address));

      await swapToken(provider, router, ant, swapAmount.div(2), dai, cash);
      await advanceTimeAndBlock(provider, oraclePeriod);
      await oracle.update();
      const redeemAmount = await cash.balanceOf(treasury.address);

      await bond.connect(operator).transfer(ant.address, redeemAmount);
      await bond.connect(ant).approve(treasury.address, redeemAmount);
      await expect(
        treasury.connect(ant).redeemBonds(redeemAmount, ETH)
      ).to.revertedWith('Treasury: cash price moved');
    });

    it('should fail when user tries to redeem bonds with zero amount', async () => {
      const price = await treasury.getCashPrice();
      await expect(
        treasury.connect(ant).redeemBonds(ZERO, price)
      ).to.revertedWith('Treasury: cannot redeem bonds with zero amount');
    });

    it('should fail when cash price is below $1+ε', async () => {
      const price = await treasury.getCashPrice();
      await expect(
        treasury.connect(ant).redeemBonds(ZERO.add(1), price)
      ).to.revertedWith('Treasury: cashPrice not eligible for bond purchase');
    });

    it("should fail when user tries to redeem bonds with over contract's budget", async () => {
      await swapToken(provider, router, ant, swapAmount, dai, cash);
      await advanceTimeAndBlock(provider, allocationDelay);
      await oracle.update();
      await treasury.connect(operator).allocateSeigniorage();

      const price = await treasury.getCashPrice();
      const treasuryBalance = await cash.balanceOf(treasury.address);
      await expect(
        treasury.connect(ant).redeemBonds(treasuryBalance.add(1), price)
      ).to.revertedWith('Treasury: treasury has no more budget');
    });
  });
});
