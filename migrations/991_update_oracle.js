const Oracle = artifacts.require('Oracle');

module.exports = async (deployer, network, accounts) => {
  const oracle = await Oracle.deployed();
  // await oracle.update();
  // console.log("oracle updated");



  
  console.log("token0: ",await oracle.token0.call());
  console.log("token1: ",await oracle.token1.call());

  console.log("pair: ",await oracle.pair.call()); //oracle is bac-dai oracle

  const blockTimestampLast = web3.utils.BN(await oracle.blockTimestampLast.call()).toString();
  console.log("blockTimestampLast: ",blockTimestampLast); 


  const price0CumulativeLast = web3.utils.BN(await oracle.price0CumulativeLast.call()).toString();
  console.log("price0CumulativeLast: ",price0CumulativeLast); 

  const price1CumulativeLast = web3.utils.BN(await oracle.price1CumulativeLast.call()).toString();
  console.log("price1CumulativeLast: ",price1CumulativeLast); 


  const price0Average = web3.utils.BN(await oracle.price0Average.call()).toString();
  console.log("price0Average: ",price0Average); 

  const price1Average = web3.utils.BN(await oracle.price1Average.call()).toString();
  console.log("price1Average: ",price1Average); 



}