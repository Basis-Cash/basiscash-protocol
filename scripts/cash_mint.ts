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
const SEIGNIORAGE_AMOUNT = ethers.constants.WeiPerEther.mul(10000).toString();


async function main() {
  console.log('\n===================== cash.mint() ==============================\n');
  // === token
  const cash = await ethers.getContractAt('Cash', OLD.Cash);
  const bond = await ethers.getContractAt('Bond', OLD.Bond);
  const share = await ethers.getContractAt('Share', OLD.Share);
  console.log("cash.address: ",cash.address);
  console.log("bond.address: ",bond.address);
  console.log("share.address: ",share.address);

  // === core
  const seigniorageOracle = await ethers.getContractAt('Oracle', OLD.Oracle);
  const timelock = await ethers.getContractAt('Timelock', OLD.Timelock);
  const treasury = await ethers.getContractAt('Treasury', OLD.Treasury);
  const boardroom = await ethers.getContractAt('Boardroom', OLD.Boardroom);

  // console.log("seigniorageOracle: ",seigniorageOracle.address);
  // console.log("timelock: ",timelock.address);
  // console.log("treasury: ",treasury.address);
  // console.log("boardroom: ",boardroom.address);

  console.log("cash minted ",SEIGNIORAGE_AMOUNT);
  await cash
    .connect(treasury.address)
    .mint(treasury.address, SEIGNIORAGE_AMOUNT);

  console.log('\n===================== end of cash.mint() ==============================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
