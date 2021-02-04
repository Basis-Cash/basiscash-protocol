import { network, ethers } from 'hardhat';
import { ParamType, keccak256 } from 'ethers/lib/utils';

import {
  DAI,
  ORACLE_START_DATE,
  TREASURY_START_DATE,
  UNI_FACTORY,
} from '../deploy.config';
import OLD from '../deployments/013101.json';
import { wait } from './utils';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function encodeParameters(
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

async function main() {
  // if (network.name !== 'mainnet') {
  //   throw new Error('wrong network');
  // }

  const { provider } = ethers;
  const [operator] = await ethers.getSigners();

  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(10).div(2);

  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  const override = { gasPrice };

  console.log("provider: ",provider.detectNetwork);
  console.log("operater: ",operator.address);

  // Fetch existing contracts
  // === token
  const cash = await ethers.getContractAt('Cash', OLD.Cash);
  const bond = await ethers.getContractAt('Bond', OLD.Bond);
  const share = await ethers.getContractAt('Share', OLD.Share);
  // console.log("cash.address: ",cash.address);
  // console.log("bond.address: ",bond.address);
  // console.log("share.address: ",share.address);

  // === core
  const seigniorageOracle = await ethers.getContractAt('Oracle', OLD.Oracle);
  const timelock = await ethers.getContractAt('Timelock', OLD.Timelock);
  const treasury = await ethers.getContractAt('Treasury', OLD.Treasury);
  const boardroom = await ethers.getContractAt('Boardroom', OLD.Boardroom);
  const mockDai = await ethers.getContractAt('MockDai', OLD.MockDai);
  const daibacklptoken_basPool = await ethers.getContractAt('DAIBACLPTokenSharePool', OLD.DAIBACLPTokenSharePool);
  
//   const basisShare = await daibacklptoken_basPool.basisShare.call();
//   console.log("basisShare: ",basisShare.toString());

    // const foundationA = await daibacklptoken_basPool.foundationA.call();
    // console.log("foundationA: ",foundationA.toString());

    const DURATION = await daibacklptoken_basPool.DURATION.call();
    console.log("DURATION: ",DURATION.toString());

    const rewardRate = await daibacklptoken_basPool.rewardRate.call();
    console.log("rewardRate: ",rewardRate.toString());

    


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
