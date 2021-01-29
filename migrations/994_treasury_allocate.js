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
// const SEIGNIORAGE_AMOUNT = web3.utils.toBN(10 ** 18).muln(10000).toString();


module.exports = async (deployer, network, accounts) => {
    const treasury = await Treasury.deployed();
    console.log("treasury address is: ",treasury.address);
  
    
    await treasury.allocateSeigniorage();
    

    // const cash = await Cash.deployed();
    // console.log("cash address is: ",cash.address);
    
    // const share = await Share.deployed();
    // console.log("share address is: ",share.address);
  
    // const bond = await Bond.deployed();
    // console.log("bond address is: ",bond.address);

    // const boardroom = await Boardroom.deployed();
    // console.log("boardroom address is: ",boardroom.address);

    // const cash_operator = await cash.operator.call();
    // console.log("cash_operator : ",cash_operator);

    // const bond_operator = await bond.operator.call();
    // console.log("bond_operator : ",bond_operator);

    // const share_operator = await share.operator.call();
    // console.log("share_operator : ",share_operator);

    // const boardroom_operator = await boardroom.operator.call();
    // console.log("boardroom_operator: ",boardroom_operator);




  

}
