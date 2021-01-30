const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const Timelock = artifacts.require('Timelock');
const Oracle = artifacts.require('Oracle');

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 86400;

module.exports = async (deployer, network, accounts) => {
  const cash = await Cash.deployed();
  console.log("cash address is: ",cash.address);
  
  const share = await Share.deployed();
  console.log("share address is: ",share.address);

  const bond = await Bond.deployed();
  console.log("bond address is: ",bond.address);

  const boardroom = await Boardroom.deployed();
  console.log("boardroom address is: ",boardroom.address);

  const treasury = await Treasury.deployed();
  console.log("treasury address is: ",treasury.address);

  for await (const contract of [ cash, share, bond ]) {
    console.log(contract.address, " transferOperator to", treasury.address);
    await contract.transferOperator(treasury.address);

    console.log(contract.address, " transferOwnership to", treasury.address);
    await contract.transferOwnership(treasury.address);
  }

  console.log("boardroom address ",boardroom.address, " transferOperator to ",treasury.address);
  await boardroom.transferOperator(treasury.address);
  console.log("boardroom address ",boardroom.address, " transferOwnership to ",treasury.address);
  await boardroom.transferOwnership(treasury.address);

  const timelock = await deployer.deploy(Timelock, accounts[0], 2 * MINUTE);

  //trasfer treasury
  // console.log("treasury address ",treasury.address, " transferOperator to ",timelock.address);
  // await treasury.transferOperator(timelock.address);
  // console.log("treasury address ",treasury.address, " transferOwnership to ",timelock.address);
  // await treasury.transferOwnership(timelock.address);

  console.log(`Transferred the operator role from the deployer (${accounts[0]}) to Treasury (${Treasury.address})`);
}
