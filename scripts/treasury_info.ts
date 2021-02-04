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
  const mockdai = await ethers.getContractAt("MockDai",OLD.MockDai);
  const daibacklptoken_basPool = await ethers.getContractAt('DAIBACLPTokenSharePool',OLD.DAIBACLPTokenSharePool);

  // console.log("seigniorageOracle: ",seigniorageOracle.address);
  // console.log("timelock: ",timelock.address);
  // console.log("treasury: ",treasury.address);
  // console.log("boardroom: ",boardroom.address);

  console.log('Deployments');
  console.log(JSON.stringify(OLD, null, 2));

  if (operator.address !== (await timelock.admin())) {
    throw new Error(`Invalid admin ${operator.address}`);
  }
  console.log(`Admin verified ${operator.address}`);

  const Oracle = await ethers.getContractFactory('Oracle');
  const Treasury = await ethers.getContractFactory('Treasury');
  // const Boardroom = await ethers.getContractFactory('Boardroom');
  const SimpleFund = await ethers.getContractFactory('SimpleERCFund');

  
  
  let eta;
  let calldata;
  let txHash;
  let tx;

  // const SEIGNIORAGE_AMOUNT = ethers.constants.WeiPerEther.mul(10000).toString();
  // console.log("--------- boardroom allocate -----------");
  // await boardroom
  //   .connect(operator)
  //   .allocateSeigniorage(SEIGNIORAGE_AMOUNT);
  // await cash
  //   .connect(operator)
  //   .mint(treasury.address,SEIGNIORAGE_AMOUNT);
  // console.log("--------- end of boardroom allocate -----------");

  console.log("---------- treasury.info ------------");

  const mockdai_totalSupply = await mockdai.totalSupply.call();
  console.log("mockdai_totalSupply: ",mockdai_totalSupply.toString());

  const treasury_operator = await treasury.operator.call();
  console.log("treasury_operator: ",treasury_operator);

  const cash_totalSupply = await cash.totalSupply.call();
  console.log("cash_totalSupply: ",cash_totalSupply.toString());
  
  // const nextEpochPoint = await seigniorageOracle.nextEpochPoint();
  // console.log("nextEpochPoint: ",nextEpochPoint.toString());

  // const treasury_getCurrentEpoch = await treasury.getCurrentEpoch.call();
  // console.log("treasury_getCurrentEpoch: ",treasury_getCurrentEpoch.toString());

  // const treasury_getPeriod = await treasury.getPeriod.call();
  // console.log("treasury_getPeriod: ",treasury_getPeriod.toString());

  // const treasury_getStartTime = await treasury.getStartTime.call();
  // console.log("treasury_getStartTime: ",treasury_getStartTime.toString());

  const treasury_nextEpochPoint = await treasury.nextEpochPoint.call();
  console.log("treasury_nextEpochPoint: ",treasury_nextEpochPoint.toString());




  const getBondOraclePrice = await treasury.getBondOraclePrice.call();
  console.log("getBondOraclePrice: ",getBondOraclePrice.toString());

  const getSeigniorageOraclePrice = await treasury.getSeigniorageOraclePrice.call();
  console.log("getSeigniorageOraclePrice: ",getSeigniorageOraclePrice.toString());

  const getReserve = await treasury.getReserve.call();
  console.log("getReserve: ",getReserve.toString());

  const cashPriceCeiling = await treasury.cashPriceCeiling.call();
  console.log("cashPriceCeiling: ",cashPriceCeiling.toString());

  console.log("---------- end of treasury.info ------------");

  // console.log("---------- boardroom info -----------");
  const boardroom_totalSupply = await boardroom.totalSupply.call();
  console.log("boardroom_totalSupply: ",boardroom_totalSupply.toString());

  // console.log("---------- end of boardroom info -----------");

  // console.log("---------- treasury.core ------------");

  // const fund_address = await treasury.fund.call();
  // console.log("fund_address: ",fund_address.toString());

  // const cash_address = await treasury.cash.call();
  // console.log("cash_address: ",cash_address.toString());

  // const bond_address = await treasury.bond.call();
  // console.log("bond_address: ",bond_address.toString());

  // const share_address = await treasury.share.call();
  // console.log("share_address: ",share_address.toString());

  // const boardroom_address = await treasury.boardroom.call();
  // console.log("boardroom_address: ",boardroom_address.toString());


  // console.log("---------- end of treasury.core ------------");

  // console.log("---------- treasury.params ------------");

  // const migrated = await treasury.migrated.call();
  // console.log("migrated: ",migrated.toString());

  // const initialized = await treasury.initialized.call();
  // console.log("initialized: ",initialized.toString());

  // const cashPriceOne = await treasury.cashPriceOne.call();
  // console.log("cashPriceOne: ",cashPriceOne.toString());

  // const cashPriceCeiling = await treasury.cashPriceCeiling.call();
  // console.log("cashPriceCeiling: ",cashPriceCeiling.toString());

  // // const bondDepletionFloor = await treasury.bondDepletionFloor.call();
  // // console.log("bondDepletionFloor: ",bondDepletionFloor.toString());

  // // const fundAllocationRate = await treasury.fundAllocationRate.call();
  // // console.log("fundAllocationRate: ",fundAllocationRate.toString());

  // const inflationPercentCeil = await treasury.inflationPercentCeil.call();
  // console.log("inflationPercentCeil: ",inflationPercentCeil.toString());

  // const cash_totalSupply = await cash.totalSupply.call();
  // console.log("cash_totalSupply: ",cash_totalSupply.toString());

  // const cash_balanceOfTreasury = await cash.balanceOf(treasury.address);
  // console.log("cash_balanceOfTreasury: ",cash_balanceOfTreasury.toString());

  // console.log("---------- end of treasury.params ------------");

  





  // 2. treasury.allocateSeigniorage queueTransaction
  // eta = Math.round(new Date().getTime() / 1000) + 2 * DAY + 60;
  // eta = Math.round(new Date().getTime() / 1000) + 300;
  // calldata = [
  //   treasury.address,
  //   0,
  //   'allocateSeigniorage()',
  //   0,
  //   eta,
  // ];
  // txHash = keccak256(
  //   encodeParameters(
  //     ['address', 'uint256', 'string', 'bytes', 'uint256'],
  //     calldata
  //   )
  // );

  // tx = await timelock.connect(operator).queueTransaction(...calldata, override);
  // await wait(
  //   tx.hash,
  //   `\n2. timelock.queueTransaction (treasury.allocateSeigniorage) => txHash: ${txHash}`
  // );
  // console.log(`Tx execution ETA: ${eta}`);

  // if (!(await timelock.connect(operator).queuedTransactions(txHash))) {
  //   throw new Error('wtf');
  // }

  // 3. treasury.allocateSeigniorage execTransaction
  // eta = Math.round(new Date().getTime() / 1000) + 2 * DAY + 60;
  // eta = 1611907005;
  // calldata = [
  //   treasury.address,
  //   0,
  //   'allocateSeigniorage()',
  //   0,
  //   eta,
  // ];
  // txHash = keccak256(
  //   encodeParameters(
  //     ['address', 'uint256', 'string', 'bytes', 'uint256'],
  //     calldata
  //   )
  // );

  // tx = await timelock.connect(operator).executeTransaction(...calldata, override);
  // await wait(
  //   tx.hash,
  //   `\n2. timelock.executeTransaction (treasury.allocateSeigniorage) => txHash: ${txHash}`
  // );
  // console.log(`Tx execution ETA: ${eta}`);

  // if (!(await timelock.connect(operator).queuedTransactions(txHash))) {
  //   throw new Error('wtf');
  // }




  console.log('OK!');

  console.log('\n===================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
