const Oracle = artifacts.require('Oracle');

module.exports = async (deployer, network, accounts) => {
  const oracle = await Oracle.deployed();
  await oracle.update();
  console.log("oracle updated");
}