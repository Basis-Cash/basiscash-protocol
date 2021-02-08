import { ChainId, Pair, Token, TokenAmount } from '@uniswap/sdk';
import { Contract } from 'ethers';
import { ethers, network } from 'hardhat';
import { CONTRACTS } from './config';

import { wait } from './utils';

const TEST_MONEY = ethers.utils.parseEther('10000000');

function getAddress(tokenA: Contract, tokenB: Contract): string {
  let chainId;

  switch (network.name) {
    case 'mainnet':
      chainId = ChainId.MAINNET;
      break;
    case 'rinkeby':
      chainId = ChainId.RINKEBY;
      break;
    default:
      throw Error('invalid network');
  }

  return Pair.getAddress(
    new Token(chainId, tokenA.address, 18),
    new Token(chainId, tokenB.address, 18)
  );
}

export async function deployToken(): Promise<{ [name: string]: Contract }> {
  const [operator] = await ethers.getSigners();

  const MockDai = await ethers.getContractFactory('MockDai');
  const Bond = await ethers.getContractFactory('Bond');
  const Cash = await ethers.getContractFactory('Cash');
  const ShareV1 = await ethers.getContractFactory('Share');
  const ShareV2 = await ethers.getContractFactory('ShareV2');

  let tx;

  let dai: Contract;
  if (CONTRACTS[network.name]?.tokens?.dai !== '') {
    dai = await ethers.getContractAt(
      'IERC20',
      CONTRACTS[network.name].tokens.dai
    );
  } else {
    dai = await MockDai.connect(operator).deploy();
    await wait(
      ethers,
      dai.deployTransaction.hash,
      `deploy.testdai: ${dai.address}`
    );

    tx = await dai.connect(operator).mint(operator.address, TEST_MONEY);
    await wait(ethers, tx.hash, `testdai.mint`);
  }

  let bond: Contract;
  if (CONTRACTS[network.name]?.tokens?.bond !== '') {
    bond = await ethers.getContractAt(
      'IERC20',
      CONTRACTS[network.name].tokens.bond
    );
  } else {
    bond = await Bond.connect(operator).deploy();
    await wait(
      ethers,
      bond.deployTransaction.hash,
      `deploy.bond: ${bond.address}`
    );

    tx = await bond.connect(operator).mint(operator.address, TEST_MONEY);
    await wait(ethers, tx.hash, `bond.mint`);
  }

  let cash: Contract;
  if (CONTRACTS[network.name]?.tokens?.cash !== '') {
    cash = await ethers.getContractAt(
      'IERC20',
      CONTRACTS[network.name].tokens.cash
    );
  } else {
    cash = await Cash.connect(operator).deploy();
    await wait(
      ethers,
      cash.deployTransaction.hash,
      `deploy.cash: ${cash.address}`
    );

    tx = await cash.connect(operator).mint(operator.address, TEST_MONEY);
    await wait(ethers, tx.hash, `cash.mint`);
  }

  const cashLP = await ethers.getContractAt('IERC20', getAddress(dai, cash));
  console.log(`deploy.bacLP: ${cashLP.address}`);

  let shareV1: Contract;
  if (CONTRACTS[network.name]?.tokens?.shareV1 !== '') {
    shareV1 = await ethers.getContractAt(
      'IERC20',
      CONTRACTS[network.name].tokens.shareV1
    );
  } else {
    shareV1 = await ShareV1.connect(operator).deploy();
    await wait(
      ethers,
      shareV1.deployTransaction.hash,
      `deploy.shareV1: ${shareV1.address}`
    );

    tx = await shareV1.connect(operator).mint(operator.address, TEST_MONEY);
    await wait(ethers, tx.hash, `shareV1.mint`);
  }

  const shareV1LP = await ethers.getContractAt(
    'IERC20',
    getAddress(dai, shareV1)
  );
  console.log(`deploy.bacLP: ${shareV1LP.address}`);

  const shareV2 = await ShareV2.connect(operator).deploy();
  await wait(
    ethers,
    shareV2.deployTransaction.hash,
    `deploy.shareV2: ${shareV2.address}`
  );

  const shareV2LP = await ethers.getContractAt(
    'IERC20',
    getAddress(dai, shareV2)
  );
  console.log(`deploy.shareV2LP: ${shareV2LP.address}\n`);

  return {
    dai,
    bond,
    cash,
    cashLP,
    shareV1,
    shareV1LP,
    shareV2,
    shareV2LP,
  };
}
