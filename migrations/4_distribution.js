// Tokens
// deployed first
const Cash = artifacts.require('Cash')
const Share = artifacts.require('Share')

// Oracle
// deployed second
const Oracle = artifacts.require('Oracle')
const MockOracle = artifacts.require('MockOracle')

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
  if (network != 'test') {
    await deployer.deploy(BAC_DAIPool, Cash.address)
    await deployer.deploy(BAC_SUSDPool, Cash.address)
    await deployer.deploy(BAC_USDCPool, Cash.address)
    await deployer.deploy(BAC_USDTPool, Cash.address)
    await deployer.deploy(BAC_YFIPool, Cash.address)

    if (network == 'mainnet') {
      let uniswap_factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
      let multidai = '0x6b175474e89094c44da98b954eedeac495271d0f'

      await deployer.deploy(Oracle, uniswap_factory, Cash.address, multidai)

      const oracle = new web3.eth.Contract(Oracle.abi, Oracle.address)
      console.log(oracle.methods)
      const dai_bac_lpt = await oracle.methods
        .pairFor(uniswap_factory, Cash.address, multidai)
        .call()
      console.log(dai_bac_lpt)
      const dai_bas_lpt = await oracle.methods
        .pairFor(uniswap_factory, Share.address, multidai)
        .call()
      console.log(dai_bas_lpt)
      // change argument on deployment
      await deployer.deploy(DAIBACLPToken_BASPool, Share.address, dai_bac_lpt)

      await deployer.deploy(DAIBASLPToken_BASPool, Share.address, dai_bas_lpt)
    }

    let uniswap_factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    let multidai = '0x6b175474e89094c44da98b954eedeac495271d0f'

    await deployer.deploy(MockOracle)

    const mock_oracle = new web3.eth.Contract(
      MockOracle.abi,
      MockOracle.address,
    )
    console.log(mock_oracle.methods)
    const dai_bac_lpt = await mock_oracle.methods
      .pairFor(uniswap_factory, Cash.address, multidai)
      .call()

    const dai_bas_lpt = await mock_oracle.methods
      .pairFor(uniswap_factory, Share.address, multidai)
      .call()
    // change argument on deployment
    await deployer.deploy(DAIBACLPToken_BASPool, Share.address, dai_bac_lpt)

    await deployer.deploy(DAIBASLPToken_BASPool, Share.address, dai_bas_lpt)

    const dai_pool = new web3.eth.Contract(BAC_DAIPool.abi, BAC_DAIPool.address)
    const susd_pool = new web3.eth.Contract(
      BAC_SUSDPool.abi,
      BAC_SUSDPool.address,
    )
    const usdc_pool = new web3.eth.Contract(
      BAC_USDCPool.abi,
      BAC_USDCPool.address,
    )
    const usdt_pool = new web3.eth.Contract(
      BAC_USDTPool.abi,
      BAC_USDTPool.address,
    )
    const yfi_pool = new web3.eth.Contract(BAC_YFIPool.abi, BAC_YFIPool.address)
    const daibaclptoken_baspool = new web3.eth.Contract(
      DAIBACLPToken_BASPool.abi,
      DAIBACLPToken_BASPool.address,
    )
    const daibaslptoken_baspool = new web3.eth.Contract(
      DAIBASLPToken_BASPool.abi,
      DAIBASLPToken_BASPool.address,
    )

    console.log('setting distributor')
    await Promise.all([
      dai_pool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
      susd_pool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
      usdc_pool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
      usdt_pool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
      yfi_pool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
      daibaclptoken_baspool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
      daibaslptoken_baspool.methods
        .setRewardDistribution(accounts[0])
        .send({ from: accounts[0], gas: 100000 }),
    ])
  }
}
