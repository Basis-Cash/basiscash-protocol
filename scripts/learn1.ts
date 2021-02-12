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
    // const txHash = "0xbc9bc27c8d458ef661c9355e35a4af24041272e600488ef17e776b0a6d4b70d4";
    // // const estimateGas = await provider.estimateGas(await provider.getTransaction(txHash));
    // // console.log("estimateGas: ",estimateGas.toString());

    // const txJson = await provider.getTransaction(txHash);
    // console.log(txJson);

    // learn provider.getBlock
    // const blockNumber = 9644700;
    // const blockHash = "0xfbe2618566c1ae6a672e7d57ab29b468d0a871be13ef4825f001612fc2a51bd3";
    // const blockInfo1 = await provider.getBlock(blockNumber);
    // const blockInfo2 = await provider.getBlock(blockHash);
    // // getblock with block number;
    // console.log("blockInfo1: ",blockInfo1); 
    // // getblock with block tx hash
    // console.log("blockInfo2: ",blockInfo2);

    // const blockWithTx = await provider.getBlockWithTransactions(blockNumber);
    // console.log("blockWithTx: ",blockWithTx);
    
    // Learn provider.resolveName
    // Lookup an address of an ENS name...
    // const ENSName = "ricmoo.firefly.eth";
    // const ENSAddress = await provider.resolveName(ENSName);
    // console.log("ENSAddress: ",ENSAddress);

    // Network Status Methods
    // const network = await provider.getNetwork();
    // console.log("network: ",network);

    // const getBlockNumber = await provider.getBlockNumber();
    // console.log("getBlockNumber: ",getBlockNumber.toString());

    // Get the current suggested gas price (in wei)...
    // const gasPrice = await provider.getGasPrice()
    // { BigNumber: "207000000000" }

    // ...often this gas price is easier to understand or
    // display to the user in gwei (giga-wei, or 1e9 wei)
    // const gasPriceGWei = utils.formatUnits(gasPrice, "gwei")
    // console.log("gasPriceGWei: ",gasPriceGWei);
    // '207.0'


    // Transactions Methods

    // const txHash = "0x1bfe5a01701760477f2d72326f13bfbd6375beaa91304cd5a97ab2918ddcff57";
    // // const txInfo = await provider.getTransaction(txHash);
    // // console.log("txInfo: ",txInfo);

    // const getTransactionReceipt = await provider.getTransactionReceipt(txHash);
    // console.log("getTransactionReceipt: ",getTransactionReceipt);

    // Event

    // Signer
    // signer.getAddress
    // const signerAddress2 = await signer.getAddress();
    // console.log("signerAddress2: ",signerAddress2.toString());

    // getBalance
    // const getBalance = await signer.getBalance();
    // console.log("getBalance: ",getBalance.toString());
    // const getBalanceInEth = utils.formatEther(getBalance);
    // console.log("getBalanceInEth: ",getBalanceInEth);

    // getChainId
    // const getChainId = await signer.getChainId();
    // console.log("getChainId: ",getChainId.toString());

    // getGasPrice
    // const getGasPrice = await signer.getGasPrice();
    // console.log("getGasPrice: ",getGasPrice.toString());
    // const getGasPriceInGWei = utils.formatUnits(getGasPrice,"gwei");
    // console.log("getGasPriceInGWei: ",getGasPriceInGWei);

    // getTransactionCount
    // const getTransactionCount = await signer.getTransactionCount();
    // console.log("getTransactionCount: ",getTransactionCount.toString());

    // // Create a wallet instance from a mnemonic...
    // const mnemonic = "announce room limb pattern dry unit scale effort smooth jazz weasel alcohol"
    // const walletMnemonic = Wallet.fromMnemonic(mnemonic)
    // // ...or from a private key
    // const walletPrivateKey = new Wallet(walletMnemonic.privateKey)

    // walletMnemonic.address === walletPrivateKey.address
    // // true

    // // The address as a Promise per the Signer API
    // console.log(await (await walletMnemonic.getAddress()).toString());
    // // { Promise: '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1' }

    // // A Wallet address is also available synchronously
    // console.log(walletMnemonic.address);
    // // '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1'

    // // The internal cryptographic components
    // console.log(walletMnemonic.privateKey);
    // // '0x1da6847600b0ee25e9ad9a52abbd786dd2502fa4005dd5af9310b7cc7a3b25db'
    // console.log(walletMnemonic.publicKey);
    // // '0x04b9e72dfd423bcf95b3801ac93f4392be5ff22143f9980eb78b3a860c4843bfd04829ae61cdba4b3b1978ac5fc64f5cc2f4350e35a108a9c9a92a81200a60cd64'


    // A Human-Readable ABI; any supported ABI format could be used
const abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (boolean)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];

// This can be an address or an ENS name
const address = "dai.tokens.ethers.eth";

// Read-Only; By connecting to a Provider, allows:
// - Any constant function
// - Querying Filters
// - Populating Unsigned Transactions for non-constant methods
// - Estimating Gas for non-constant (as an anonymous sender)
// - Static Calling non-constant methods (as anonymous sender)
const erc20 = new ethers.Contract(address, abi, provider);

// // Read-Write; By connecting to a Signer, allows:
// // - Everything from Read-Only (except as Signer, not anonymous)
// // - Sending transactions for non-constant functions
const erc20_rw = new ethers.Contract(address, abi, signer)

const erc20address  = erc20.address;
console.log("erc20address: ",erc20address);
const erc20deployTransaction = erc20.deployTransaction;
console.log("erc20deployTransaction: ",erc20deployTransaction);



}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});