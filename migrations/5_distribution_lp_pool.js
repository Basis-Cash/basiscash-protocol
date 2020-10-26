const knownContracts = require('./known-contracts');

const Cash = artifacts.require('Cash');
const Share = artifacts.require('Share');
const Oracle = artifacts.require('Oracle');
const MockDai = artifacts.require('MockDai');
const DAIBACLPToken_BASPool = artifacts.require('DAIBACLPTokenSharePool')
const DAIBASLPToken_BASPool = artifacts.require('DAIBASLPTokenSharePool')

module.exports = async (deployer, network, accounts) => {
  const uniswapFactory = knownContracts.UniswapV2Factory[network];
  const dai = network === 'mainnet'
    ? await IERC20.at(knownContracts.DAI[network])
    : await MockDai.deployed();

  const oracle = await Oracle.deployed();

  const dai_bac_lpt = await oracle.pairFor(uniswapFactory, Cash.address, dai.address);
  const dai_bas_lpt = await oracle.pairFor(uniswapFactory, Share.address, dai.address);

  await deployer.deploy(DAIBACLPToken_BASPool, Share.address, dai_bac_lpt);
  await deployer.deploy(DAIBASLPToken_BASPool, Share.address, dai_bas_lpt);

  console.log(`Setting distributor to ${accounts[0]}`);
  await Promise.all(
    [
      await DAIBACLPToken_BASPool.deployed(),
      await DAIBASLPToken_BASPool.deployed(),
    ].map(pool => pool.setRewardDistribution(accounts[0])),
  );
};
