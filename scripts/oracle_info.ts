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
  console.log('\n===================== Oracle.info() ==============================\n');
  const oracle = await ethers.getContractAt('Oracle', OLD.Oracle);
  console.log("oracle address: ",oracle.address.toString());

  const oracle_operator = await oracle.operator.call();
  console.log("oracle_operator: ",oracle_operator.toString());

  const oracle_nextEpochPoint = await oracle.nextEpochPoint.call();
  console.log("oracle_nextEpochPoint: ",oracle_nextEpochPoint.toString());
  
  console.log('\n===================== end of Oracle.info() ==============================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
