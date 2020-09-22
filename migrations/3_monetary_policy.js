const knownContracts = require('./known-contracts');

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

async function migration(deployer, network, accounts) {
  // Deploy boardroom
  await deployer.deploy(Boardroom, Cash.address, Share.address)

  if (network === 'mainnet' || network === 'ropsten') {
    const uniswapFactoryAddr = knownContracts.UniswapV2Factory[network]; // equal on all networks
    const uniswapRouterAddr = knownContracts.UniswapV2Router02[network]; // equal on all networks
    const multidai = knownContracts.DAI[network];
    const uniswap = await UniswapV2Factory.at(uniswapFactoryAddr);

    // 1. create pair between bac-dai, bas-dai
    try {
      await uniswap.createPair(Cash.address, multidai)
      await uniswap.createPair(Share.address, multidai);

    } catch (err) {
      console.log("Warning: Failed to create pair on Uniswap. (maybe you've been already created it!)");
      console.log(`- ${err.stack}`)
    }

    // 2. provide liquidity to BAC-DAI and BAS-DAI pair
    // if you don't provide liquidity to BAC-DAI and BAS-DAI pair after step 1 and before step 3,
    //  creating Oracle will fail with NO_RESERVES error.

    let cashContract = new web3.eth.Contract(Cash.abi, Cash.address)
    let shareContract = new web3.eth.Contract(Share.abi, Share.address)
    let uniswapRouterContract = new web3.eth.Contract(JSON.parse(knownContracts.UniswapV2Router02ABI[network]), uniswapRouterAddr)
    let multidaiContract = new web3.eth.Contract(JSON.parse(knownContracts.DAIABI[network]), multidai)

    const stdDecimals = Math.pow(10, 18);
    const uintDecimals = "0x" + stdDecimals.toString(16);

    try {
        await cashContract.methods.approve(accounts[0], uintDecimals).call();
        await shareContract.methods.approve(accounts[0], uintDecimals).call();
        await multidaiContract.methods.approve(accounts[0], "0x" + (2 * Math.pow(10, 18)).toString(16)).call();
        // WARNING: msg.sender must hold enough DAI to add liquidity to BAC-DAI & BAS-DAI pools
        // otherwise transaction will revert
        await uniswapRouterContract.methods.addLiquidity(
          Cash.address,
          multidai,
          uintDecimals,
          uintDecimals,
          "0x" + (5 * Math.pow(10, 17)).toString(16),
          "0x" + (5 * Math.pow(10, 17)).toString(16),
          accounts[0],
          "0x" + (Date.now() + 10**5).toString(16)
        ).call();
        await uniswapRouterContract.methods.addLiquidity(
          Share.address,
          multidai,
          uintDecimals,
          uintDecimals,
          "0x" + (5 * Math.pow(10, 17)).toString(16),
          "0x" + (5 * Math.pow(10, 17)).toString(16),
          accounts[0],
          "0x" + (Date.now() + 10**5).toString(16)
        ).call();
    } catch (err) {
      console.log("Warning: Failed to add liquidity on Uniswap.");
      console.log(`- ${err.stack}`)
    }
    
    // 3. Deploy oracle for the pair between bac and dai
    await deployer.deploy(
      Oracle,
      uniswapFactoryAddr,
      Cash.address,
      multidai,
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
  } /*else {
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
  }*/

  let cashContract = new web3.eth.Contract(Cash.abi, Cash.address)
  await cashContract.methods.transferOperator(Treasury.address).call()

  let bondContract = new web3.eth.Contract(Bond.abi, Bond.address)
  await bondContract.methods.transferOperator(Treasury.address).call()
  
  let shareContract = new web3.eth.Contract(Share.abi, Share.address)
  await shareContract.methods.transferOperator(Treasury.address).call()
}

module.exports = migration;