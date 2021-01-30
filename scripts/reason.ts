import { network, ethers} from 'hardhat';
import { ParamType, keccak256 } from 'ethers/lib/utils';

import {
  DAI,
  ORACLE_START_DATE,
  TREASURY_START_DATE,
  UNI_FACTORY,
} from '../deploy.config';
import OLD from '../deployments/012901.json';
import { wait } from './utils';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const provider = ethers.provider;

function hex_to_ascii(str1) {
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
};

async function main() {
    console.log("hello world");
    let hash;
    hash = "0x102d346504b3535d347d3c675b0469f3ab5d98b47c7bbc69e214994eae02342c";
    console.log("------------------------------")
    
    console.log(ethers.provider.network);
    let tx = await ethers.provider.getTransaction(hash);

    if (!tx) {
        console.log('tx not found')
    } else {
        let code = await ethers.provider.call(tx, tx.blockNumber)
        let reason = hex_to_ascii(code.substr(138))
        console.log('revert reason:', reason)
}
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
