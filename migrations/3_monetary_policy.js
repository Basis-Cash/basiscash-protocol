// ============ Contracts ============

// Token
// deployed first
const Cash = artifacts.require("Cash");
const Bond = artifacts.require("Bond");
const Share = artifacts.require("Share");

// Rs
// deployed second
const Oracle = artifacts.require("Oracle");
const MockOracle = artifacts.require("MockOracle");
const Boardroom = artifacts.require("Boardroom");
const Treasury = artifacts.require("Treasury");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployMp(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployMp(deployer, network) {
    
    // Deploy boardroom
    await deployer.deploy(Boardroom,
        Cash.address,
        Share.address,
    );
    
    // Deploy oracle
    if (network == "mainnet") {
        let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
        let multidai = "0x6b175474e89094c44da98b954eedeac495271d0f";
        await deployer.deploy(Oracle,
            uniswap_factory,
            Cash.address,
            multidai,
        );
        
        await deployer.deploy(MockOracle);

        await deployer.deploy(Treasury,
            Cash.address, 
            Bond.address, 
            Share.address, 
            Oracle.address, 
            multidai,
            Boardroom.address
        );


    } else {
        await deployer.deploy(MockOracle);

        await deployer.deploy(Treasury, 
            Cash.address, 
            Bond.address, 
            Share.address, 
            MockOracle.address, 
            Share.address, 
            Boardroom.address
        );
    }

    let cashContract = new web3.eth.Contract(Cash.abi, Cash.address);
    await cashContract.methods.transferOperator(Treasury.address).call();

    let bondContract = new web3.eth.Contract(Bond.abi, Bond.address);
    await bondContract.methods.transferOperator(Treasury.address).call();

    let shareContract = new web3.eth.Contract(Share.abi, Share.address);
    await shareContract.methods.transferOperator(Treasury.address).call();
}

