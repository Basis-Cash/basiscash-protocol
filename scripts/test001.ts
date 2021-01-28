import { network, ethers } from 'hardhat';

import {
  DAI,
  ORACLE_START_DATE,
  TREASURY_START_DATE,
  UNI_FACTORY,
} from '../deploy.config';
import OLD from '../deployments/0128.json';
import { wait } from './utils';

async function main() {
  const { provider } = ethers;
  const [operator] = await ethers.getSigners();

  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  const override = { gasPrice };

  console.log("network.name: ",network.name);

  console.log("operator: ",operator.address);
  console.log("estimateGasPrice: ",estimateGasPrice.toString());

  // Fetch existing contracts
  // === token
  const cash = await ethers.getContractAt('Cash', OLD.Cash);
  const bond = await ethers.getContractAt('Bond', OLD.Bond);
  const share = await ethers.getContractAt('Share', OLD.Share);
  const mockDai = await ethers.getContractAt('MockDai',OLD.MockDai);
  console.log("cash.address",cash.address);
  console.log("bond.address",bond.address);
  console.log("share.address",share.address);
  console.log("mockDai.address",mockDai.address);

    // === core
    const boardroom = await ethers.getContractAt('Boardroom', OLD.Boardroom);
    const oracle = await ethers.getContractAt('Oracle', OLD.Oracle);
    const treasury = await ethers.getContractAt('Treasury', OLD.Treasury);
    
    console.log("boardroom.address: ",boardroom.address);
    console.log("oracle: ",oracle.address);
    console.log("treasury.address: ",treasury.address);

    console.log('Deployments');
    console.log(JSON.stringify(OLD, null, 2));

    const Oracle = await ethers.getContractFactory('Oracle');
    const Treasury = await ethers.getContractFactory('Treasury');
    // const Boardroom = await ethers.getContractFactory('Boardroom');
    const SimpleFund = await ethers.getContractFactory('SimpleERCFund');

    // console.log("-----begin oracle.update()");
    // await oracle
    //   .connect(operator)
    //   .update();
    // console.log("------ end oracle.update()");

    const SEIGNIORAGE_AMOUNT = ethers.constants.WeiPerEther.mul(10000).toString();
    console.log("SEIGNIORAGE_AMOUNT: ",SEIGNIORAGE_AMOUNT);

    const cash_operator = await cash
      .connect(operator)
      .operator();
    
    console.log("cash_operator: ",cash_operator);
    


    // await cash
    //   .connect(treasury.address)
    //   .mint(treasury.address, SEIGNIORAGE_AMOUNT);
    // console.log("minted bdc: ",SEIGNIORAGE_AMOUNT);

    const balance = await cash
      .connect(operator)
      // .mint(operator.address, SEIGNIORAGE_AMOUNT);
      .balanceOf(operator.address);
    console.log("balance: ",balance.toString());

    // await cash
    //   .connect(operator)
    //   .approve(boardroom.address, SEIGNIORAGE_AMOUNT);

    // console.log("booardroom allocateSeigniorage");
    // await boardroom
    //   .connect(operator)
    //   .allocateSeigniorage(SEIGNIORAGE_AMOUNT);
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });