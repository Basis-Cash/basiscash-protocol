import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

chai.use(solidity);

describe('BIP11Curve', () => {
  const { provider } = ethers;

  const MIN_PRICE = BigNumber.from(0);
  const MAX_PRICE = utils.parseEther('1');
  const MIN_RATE = utils.parseEther('0.25');
  const MAX_RATE = utils.parseEther('1');

  let operator: SignerWithAddress;

  before('provider & accounts setting', async () => {
    [operator] = await ethers.getSigners();
  });

  let bip11: Contract;

  before('deploy curve', async () => {
    const BIP11 = await ethers.getContractFactory('BIP11');
    bip11 = await BIP11.connect(operator).deploy(
      MIN_PRICE,
      MAX_PRICE,
      MIN_RATE,
      MAX_RATE
    );
  });

  it('should work correctly', async () => {
    const iter = 1000;
    const width = MAX_PRICE.sub(MIN_PRICE).div(iter);
    for (let i = 0; i <= iter; i++) {
      const rate = await bip11.calcCeiling(MIN_PRICE.add(width.mul(i)));
      console.log(
        utils.formatEther(MIN_PRICE.add(width.mul(i))),
        utils.formatEther(rate)
      );
    }
  });

  it('should return min rate when (price <= min price)', async () => {
    const rate = await bip11.calcCeiling(MIN_PRICE);
    expect(rate).to.eq(MIN_RATE);
  });

  it('shuold return max rate when (price >= max price)', async () => {
    const rate = await bip11.calcCeiling(MAX_PRICE);
    expect(rate).to.eq(MAX_RATE);
  });
});
