import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { ContractFactory } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

chai.use(solidity);

describe('Operator', () => {
  const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

  let owner: SignerWithAddress;
  let whale: SignerWithAddress;

  before('setup accounts', async () => {
    [owner, whale] = await ethers.getSigners();
  });

  let Tester: ContractFactory;

  before('fetch contract factories', async () => {
    Tester = await ethers.getContractFactory('Tester');
  });

  it('work correctly', async () => {
    const operator = await Tester.connect(owner).deploy(ZERO_ADDR, ZERO_ADDR);
    expect(await operator.operator()).to.eq(owner.address);
    expect(await operator.connect(owner).isOperator()).to.be.true;
    expect(await operator.connect(whale).isOperator()).to.be.false;
    await expect(operator.connect(whale).OnlyOperator()).to.revertedWith(
      'operator: caller is not the operator'
    );

    await expect(operator.connect(owner).transferOperator(whale.address))
      .to.emit(operator, 'OperatorTransferred')
      .withArgs(ZERO_ADDR, whale.address);
    await expect(
      operator.connect(owner).transferOperator(ZERO_ADDR)
    ).to.revertedWith('operator: zero address given for new operator');

    expect(await operator.operator()).to.eq(whale.address);
    expect(await operator.connect(whale).isOperator()).to.be.true;
    expect(await operator.connect(owner).isOperator()).to.be.false;
    await expect(operator.connect(whale).OnlyOperator())
      .to.emit(operator, 'OKOnlyOperator')
      .withArgs(whale.address);
  });
});
