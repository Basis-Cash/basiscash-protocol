import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

chai.use(solidity);

describe('SigmoidThreshold', () => {
  const { provider } = ethers;

  const MIN_SUPPLY = utils.parseEther('1000');
  const MAX_SUPPLY = utils.parseEther('24000');
  const MIN_CEILING = utils.parseEther('1.01');
  const MAX_CEILING = utils.parseEther('1.05');

  let operator: SignerWithAddress;

  before('provider & accounts setting', async () => {
    [operator] = await ethers.getSigners();
  });

  let sigmoid: Contract;

  before('deploy curve', async () => {
    const Sigmoid = await ethers.getContractFactory('SigmoidThreshold');
    sigmoid = await Sigmoid.connect(operator).deploy(
      MIN_SUPPLY,
      MAX_SUPPLY,
      MIN_CEILING,
      MAX_CEILING
    );
  });

  it('should return max ceiling (supply <= min supply)', async () => {
    const ceiling = await sigmoid.calcCeiling(MIN_SUPPLY.sub(1));
    expect(ceiling).to.eq(MAX_CEILING);
  });

  it('should return min ceiling (supply >= max supply)', async () => {
    const ceiling = await sigmoid.calcCeiling(MAX_SUPPLY.add(1));
    expect(ceiling).to.eq(MIN_CEILING);
  });
});
