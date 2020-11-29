const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');

const TARGET_ADDR = '0xd78EC7CCDd3e51C29229e18ddE44337A7bd38e5b';

module.exports = async (deployer, network, accounts) => {
  const cash = await Cash.deployed();
  const share = await Share.deployed();
  const bond = await Bond.deployed();
  const treasury = await Treasury.deployed();
  const boardroom = await Boardroom.deployed();

  for await (const contract of [ cash, share, bond ]) {
    await contract.transferOperator(treasury.address);
    await contract.transferOwnership(treasury.address);
  }
  await boardroom.transferOperator(treasury.address);
  await boardroom.transferOwnership(TARGET_ADDR);
  await treasury.transferOperator(TARGET_ADDR);
  await treasury.transferOwnership(TARGET_ADDR);

  console.log(`Transferred the operator role from the deployer (${accounts[0]}) to Treasury (${Treasury.address})`);
}
