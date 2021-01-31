import { sign } from "crypto";
import { ethers } from "hardhat";
import OLD from '../deployments/013101.json';
const xiaolongAddress = "0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D";

async function main() {
    console.log("---------");
    const provider = ethers.provider;
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log("signerAddress: ",signerAddress.toString());
    

    // get network's blockNumber
    // const blockNumber = provider.getBlockNumber()
    // console.log("blockNumber: ",(await blockNumber).toString());

    // //get Balance
    // const balance = await provider.getBalance(signer.getAddress());
    // console.log("balance: ",balance.toString());
    // const balanceInEth = ethers.utils.formatEther(balance);
    // console.log("balanceInEth: ",balanceInEth);

    // // convert ETH to Wei
    // const ethNumber = 1.2321282438;
    // console.log("ethNumber ",ethNumber ," in Wei is: ",ethers.utils.parseEther(ethNumber.toString()).toString());

    // writing to the blockchain
    // send tx using signer.sendTransaction
    
    // const tx = signer.sendTransaction({
    //     to: xiaolongAddress,
    //     value: ethers.utils.parseEther("0.01")
    // });
    // console.log("tx hash: ",(await tx).hash);

    // You can also use an ENS name for the contract address
    // const daiAddress = OLD.MockDai;
    // console.log("daiAddress: ",daiAddress);

    // The ERC-20 Contract ABI, which is a common contract interface
    // for tokens (this is the Human-Readable ABI format)
    const daiAbi = [
    // Some details about the token
    "function name() view returns (string)",
    "function symbol() view returns (string)",

    // Get the account balance
    "function balanceOf(address) view returns (uint)",

    // Send some of your tokens to someone else
    "function transfer(address to, uint amount)",

    // An event triggered whenever anyone transfers to someone else
    "event Transfer(address indexed from, address indexed to, uint amount)"
    ];

    // The Contract object
    // const daiContract = new ethers.Contract(daiAddress, daiAbi, provider);

    // console.log("daiContract.name: ",(await daiContract.name()).toString());
    // console.log("daiContract.symbol: ",(await daiContract.symbol()).toString());
    
    // const daiContract_balance = await daiContract.balanceOf(signerAddress);
    // console.log("daiContract_balance: ",daiContract_balance.toString());
    // console.log("daiContract.balance for signer in eth: ",ethers.utils.formatEther(daiContract_balance.toString()));

    // transfer oneMockDAI to XiaoLong
    // const daiWithSigner = daiContract.connect(signer);
    // const oneMockDAI = ethers.constants.WeiPerEther;
    // await daiWithSigner.transfer(xiaolongAddress,oneMockDAI);


    // get FilterFrom & FilterTo
    // const myAddress = await signer.getAddress();
    // const filterFrom = daiContract.filters.Transfer(myAddress, null);
    // console.log("filterFrom: ",filterFrom);
    // const filterTo = daiContract.filters.Transfer(null, myAddress);
    // console.log("filterTo: ",filterTo);

    // sign message
    // const message = "hello world";
    // const signature = await signer.signMessage("hello world");
    // console.log("signature for message ", message, " is: ",signature);

    // provider.getBalance
    // console.log("provider.getBalance: ",(await provider.getBalance(signerAddress)).toString());
    
    // provider.getCode
    // const contractCode = await provider.getCode(daiContract.address);
    // console.log("contractCode: ",contractCode.toString());

    // provider.getTransactionCount
    // const getdaiContractTransactionCount = await provider.getTransactionCount(signerAddress);
    // console.log("getdaiContractTransactionCount: ",getdaiContractTransactionCount.toString());

    // provider.getBlock10000
    // const getBlock10000 = await provider.getBlock("latest");
    // console.log("getBlock10000: ",getBlock10000.toString());

    // latestBlock
    // const latestBlock = await provider.getBlock("latest");
    // console.log(latestBlock);

    // const block100004 = await provider.getBlock(100004);
    // console.log(block100004);

    // const getBlockWithTransactions100004 = await provider.getBlockWithTransactions(100004);
    // console.log(getBlockWithTransactions100004);

    // const ENS_name = await provider.lookupAddress("0x6fC21092DA55B392b045eD78F4732bff3C580e2c");
    // console.log("ENS_name: ",ENS_name);

    // const ENS_address = await provider.resolveName("ricmoo.firefly.eth");
    // console.log("ENS_address: ",ENS_address);

    // const provider_getNetwork = await provider.getNetwork();
    // console.log(provider_getNetwork);

    // const provider_getBlockNumber = await provider.getBlockNumber();
    // console.log("provider_getBlockNumber: ",provider_getBlockNumber);

    // const provider_gasPrice = await provider.getGasPrice();
    // console.log("provider_gasPrice: ",provider_gasPrice.toString());

    // const provider_gasPrice_gWei = ethers.utils.formatUnits(provider_gasPrice.toString(), "gwei");
    // console.log("provider_gasPrice_gWei: ",provider_gasPrice_gWei);

    // estimate Gas
    const txHash = "0xa1216d0034998f8c7c482de38fe6c095f309d920fb0fd49d76def58a03c1bc55";
    // const estimateGas = await provider.estimateGas(await provider.getTransaction(txHash));
    // console.log("estimateGas: ",estimateGas.toString());

    const txJson = await provider.getTransaction(txHash);
    console.log(txJson);

    
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});