// Tokens
// deployed first
const Cash = artifacts.require("Cash");
const Share = artifacts.require("Share");

// Liquidity providers
// deployed second
const Oracle = artifacts.require("Oracle");

// ============ Reward Disribution Pools ============

const BAC_DAIPool = artifacts.require('BACDAIPool')
const BAC_SUSDPool = artifacts.require('BACSUSDPool')
const BAC_USDCPool = artifacts.require('BACUSDCPool')
const BAC_USDTPool = artifacts.require('BACUSDTPool')
const BAC_YFIPool = artifacts.require('BACYFIPool')
const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployDistribution(deployer, network, accounts) {
    console.log(network)
    if (network != "test") {
        await deployer.deploy(BAC_DAIPool(Cash.address));
        await deployer.deploy(BAC_SUSDPool(Cash.address));
        await deployer.deploy(BAC_USDCPool(Cash.address));
        await deployer.deploy(BAC_USDTPool(Cash.address));
        await deployer.deploy(BAC_YFIPool(Cash.address));

        let dai_pool = new web3.eth.Contract(BAC_DAIPool.abi, BAC_DAIPool.address);
        let susd_pool = new web3.eth.Contract(BAC_SUSDPool.abi, BAC_SUSDPool.address);
        let usdc_pool = new web3.eth.Contract(BAC_USDCPool.abi, BAC_USDCPool.address);
        let usdt_pool = new web3.eth.Contract(BAC_USDTPool.abi, BAC_USDTPool.address);
        let yfi_pool = new web3.eth.Contract(BAC_YFIPool.abi, BAC_YFIPool.address);

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

            await deployer.deploy(Oracle,
                uniswap_factory,
                Share.address,
                multidai
            );
        } else {
            await deployer.deploy(MockOracle);
        }
        
        console.log("setting distributor");
        await Promise.all([
            dai_pool.methods.setRewardDistribution(accounts[0]).send({ from: accounts[0], gas: 100000 }),
            susd_pool.methods.setRewardDistribution(accounts[0]).send({ from: accounts[0], gas: 100000 }),
            usdc_pool.methods.setRewardDistribution(accounts[0]).send({ from: accounts[0], gas: 100000 }),
            usdt_pool.methods.setRewardDistribution(accounts[0]).send({ from: accounts[0], gas: 100000 }),
            yfi_pool.methods.setRewardDistribution(accounts[0]).send({ from: accounts[0], gas: 100000 }),
        ]);

        // TODO: Set up token amount to send for each pool in the first day
        let fifty_thousand = web3.utils.toBN(5*10 ** 4).mul(web3.utils.toBN(10 ** 18));

        console.log("transfering and notifying");
        console.log("b");
        await Promise.all([
            Cash.transfer(BAC_DAIPool.address, fifty_thousand.toString()),
            Cash.transfer(BAC_SUSDPool.address, fifty_thousand.toString()),
            Cash.transfer(BAC_USDCPool.address, fifty_thousand.toString()),
            Cash.transfer(BAC_USDTPool.address, fifty_thousand.toString()),
            Cash.transfer(BAC_YFIPool.address, fifty_thousand.toString()),
        ]);

        await Promise.all([
            dai_pool.methods.notifyRewardAmount(fifty_thousand.toString()).send({ from: accounts[0] }),
            susd_pool.methods.notifyRewardAmount(fifty_thousand.toString()).send({ from: accounts[0] }),
            usdc_pool.methods.notifyRewardAmount(fifty_thousand.toString()).send({ from: accounts[0] }),
            usdt_pool.methods.notifyRewardAmount(fifty_thousand.toString()).send({ from: accounts[0] }),
            yfi_pool.methods.notifyRewardAmount(fifty_thousand.toString()).send({ from: accounts[0] }),
        ]);
    }