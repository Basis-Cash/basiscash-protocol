import { sign } from "crypto";
import {ethers} from "hardhat";

async function main() {
    console.log("---------");
    const provider = ethers.provider;
    const signer = provider.getSigner();
    

    // get network's blockNumber
    const blockNumber = provider.getBlockNumber()
    console.log("blockNumber: ",(await blockNumber).toString());

    //get Balance
    const balance = await provider.getBalance(signer.getAddress());
    console.log("balance: ",balance.toString());
    const balanceInEth = ethers.utils.formatEther(balance);
    console.log("balanceInEth: ",balanceInEth);

    // convert ETH to Wei
    const ethNumber = 1.2321282438;
    console.log("ethNumber ",ethNumber ," in Wei is: ",ethers.utils.parseEther(ethNumber.toString()).toString());
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});