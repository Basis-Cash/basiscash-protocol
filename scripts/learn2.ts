import { sign } from "crypto";
import { ethers} from "hardhat";
import {utils,Wallet} from "ethers";
import OLD from '../deployments/013101.json';
const xiaolongAddress = "0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D";

// learn1.ts learn ethers.io
// url: https://docs.ethers.io/v5/
async function main() {
    console.log("---------");
    const provider = ethers.provider;
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log("signerAddress: ",signerAddress.toString());
    
    // === token
    const cash = await ethers.getContractAt('Cash', OLD.Cash);
    console.log("cash address",cash.address);

    const cash_totalSupply = await cash.totalSupply.call();
    console.log("cash_totalSupply: ",cash_totalSupply.toString());
    

}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});