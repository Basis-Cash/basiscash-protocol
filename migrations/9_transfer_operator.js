const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');

module.exports = async (deployer, network, accounts) => {
  const cash = await Cash.deployed();
  const share = await Share.deployed();
  const bond = await Bond.deployed();

  await Promise.all([
    cash.transferOperator(Treasury.address),
    bond.transferOperator(Treasury.address),
    share.transferOperator(Treasury.address),
  ]);
  console.log(`Transferred the operator role from the deployer (${accounts[0]}) to Treasury (${Treasury.address})`);
}
