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

async function main() {
  console.log('\n===================== Oracle.update() ==============================\n');
  const seigniorageOracle = await ethers.getContractAt('Oracle', OLD.Oracle);
  await seigniorageOracle.update();
  console.log('\n===================== end of Oracle.update() ==============================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
