// ============ Contracts ============

// Token
// deployed first
const Cash = artifacts.require('Cash')
const Bond = artifacts.require('Bond')
const Share = artifacts.require('Share')
const MockDai = artifacts.require('MockDai')

// Rs
// deployed second
const Oracle = artifacts.require('Oracle')
const UniswapV2Factory = artifacts.require('UniswapV2Factory')
const MockOracle = artifacts.require('MockOracle')
const Boardroom = artifacts.require('Boardroom')
const Treasury = artifacts.require('Treasury')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployMp(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployMp(deployer, network, accounts) {
  // Deploy boardroom
  await deployer.deploy(Boardroom, Cash.address, Share.address)

  // Creat pairs and deploy oracle
  if (network == 'mainnet') {
    let uniswap_factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    let multidai = '0x6b175474e89094c44da98b954eedeac495271d0f'
    uniswap = new web3.eth.Contract(UniswapV2Factory.abi, uniswap_factory)
    // Create pair between bac and dai
    const bac_dai_lpt = await uniswap.methods.createPair(Cash.address, multidai)

    // Create pair between bac and bas
    const bas_dai_lpt = await uniswap.methods.createPair(
      Share.address,
      multidai,
    )

    // Deploy oracle for the pair between bac and dai
    await deployer.deploy(
      Oracle,
      uniswap_factory,
      Cash.address,
      multidai.address,
    )

    await deployer.deploy(
      Treasury,
      Cash.address,
      Bond.address,
      Share.address,
      Oracle.address,
      multidai,
      Boardroom.address,
    )
  } else {
    await deployer.deploy(UniswapV2Factory, accounts[0])
    await deployer.deploy(MockDai)
    uniswap = new web3.eth.Contract(
      UniswapV2Factory.abi,
      UniswapV2Factory.address,
    )
    const pairAddress = await uniswap.methods
      .createPair(Cash.address, MockDai.address)
      .call()
    let two = web3.utils.toBN(2).mul(web3.utils.toBN(10 ** 18))
    let one = web3.utils.toBN(1).mul(web3.utils.toBN(10 ** 18))

    // set mockup oracle of dai price fifty thousand and basis in thirty_thousand
    await deployer.deploy(
      MockOracle,
      Cash.address,
      MockDai.address,
      two.toString(),
      one.toString(),
    )

    await deployer.deploy(
      Treasury,
      Cash.address,
      Bond.address,
      Share.address,
      MockOracle.address,
      Share.address,
      Boardroom.address,
    )
  }

  let cashContract = new web3.eth.Contract(Cash.abi, Cash.address)
  await cashContract.methods.transferOperator(Treasury.address).call()

  let bondContract = new web3.eth.Contract(Bond.abi, Bond.address)
  await bondContract.methods.transferOperator(Treasury.address).call()

  let shareContract = new web3.eth.Contract(Share.abi, Share.address)
  await shareContract.methods.transferOperator(Treasury.address).call()
}
