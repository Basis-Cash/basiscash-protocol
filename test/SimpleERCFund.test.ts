import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { advanceTimeAndBlock } from './shared/utilities';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ParamType } from 'ethers/lib/utils';
import { encodeParameters } from '../scripts/utils';

chai.use(solidity);

const DAY = 86400;
const ETH = utils.parseEther('1');
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

async function latestBlocktime(provider: Provider): Promise<number> {
  const { timestamp } = await provider.getBlock('latest');
  return timestamp;
}

describe('SimpleERCFund', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;

  before('setup accounts', async () => {
    [operator] = await ethers.getSigners();
  });

  let Fund: ContractFactory;
  let MockDAI: ContractFactory;
  let Timelock: ContractFactory;

  before('fetch contract factories', async () => {
    Fund = await ethers.getContractFactory('SimpleERCFund');
    MockDAI = await ethers.getContractFactory('MockDai');
    Timelock = await ethers.getContractFactory('Timelock');
  });

  let fund: Contract;
  let token: Contract;

  beforeEach('deploy contract', async () => {
    fund = await Fund.connect(operator).deploy();
    token = await MockDAI.connect(operator).deploy();
  });

  describe('with timelock', () => {
    let timelock: Contract;

    beforeEach('deploy timelock', async () => {
      await token.connect(operator).mint(fund.address, utils.parseEther('100'));
      timelock = await Timelock.connect(operator).deploy(
        operator.address,
        2 * DAY
      );
      await fund.connect(operator).transferOperator(timelock.address);
      await fund.connect(operator).transferOwnership(timelock.address);
    });

    it('#withdraw', async () => {
      const eta = (await latestBlocktime(provider)) + 2 * DAY + 30;
      const signature = 'withdraw(address,uint256,address,string)';
      const data = encodeParameters(
        ethers,
        ['address', 'uint256', 'address', 'string'],
        [token.address, utils.parseEther('100'), operator.address, 'TEST']
      );
      const calldata = [fund.address, 0, signature, data, eta];
      const txHash = ethers.utils.keccak256(
        encodeParameters(
          ethers,
          ['address', 'uint256', 'string', 'bytes', 'uint256'],
          calldata
        )
      );

      await expect(timelock.connect(operator).queueTransaction(...calldata))
        .to.emit(timelock, 'QueueTransaction')
        .withArgs(txHash, ...calldata);

      await advanceTimeAndBlock(
        provider,
        eta - (await latestBlocktime(provider))
      );

      const tx = await timelock
        .connect(operator)
        .executeTransaction(...calldata);
      await expect(new Promise((resolve) => resolve(tx)))
        .to.emit(timelock, 'ExecuteTransaction')
        .withArgs(txHash, ...calldata)
        .to.emit(fund, 'Withdrawal')
        .withArgs(
          timelock.address,
          operator.address,
          await latestBlocktime(provider),
          'TEST'
        );

      expect(await token.balanceOf(operator.address)).to.eq(
        utils.parseEther('10100')
      );
    });
  });
});
