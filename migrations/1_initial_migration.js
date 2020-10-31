const Artifactor = require('@truffle/artifactor');
const artifactor = new Artifactor(`${__dirname}/../build/contracts`);

const Migrations = artifacts.require('Migrations')

const InitialArtifacts = {
  UniswapV2Factory: require('@uniswap/v2-core/build/UniswapV2Factory.json'),
  UniswapV2Router02: require('@uniswap/v2-periphery/build/UniswapV2Router02.json'),
  UniswapV2Pair: require('@uniswap/v2-core/build/UniswapV2Pair.json'),
};

module.exports = async function (deployer) {
  for await ([contractName, legacyArtifact] of Object.entries(InitialArtifacts)) {
    await artifactor.save({
      contractName,
      ...legacyArtifact,
    });
  }

  await deployer.deploy(Migrations)
}
