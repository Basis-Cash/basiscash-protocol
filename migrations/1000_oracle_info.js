const Oracle = artifacts.require('Oracle');

module.exports = async (deployer, network, accounts) => {
  const oracle = await Oracle.deployed();
  await oracle.update();
  console.log("oracle updated");



  const token0 = await oracle.token0.call();
  const token1 = await oracle.token1.call();
  console.log("token0: ",token0.toString());
  console.log("token1: ",token1.toString());

  // const pair = await oracle.pair.call();
  // console.log("pair: ",pair.toString()); //oracle is bac-dai oracle




  const price0CumulativeLast = web3.utils.BN(await oracle.price0CumulativeLast.call()).toString();
  console.log("price0CumulativeLast: ",price0CumulativeLast); 

  const price1CumulativeLast = web3.utils.BN(await oracle.price1CumulativeLast.call()).toString();
  console.log("price1CumulativeLast: ",price1CumulativeLast); 

  const price0Average = web3.utils.BN(await oracle.price0Average.call()).toString();
  console.log("price0Average: ",price0Average); 

  const price1Average = web3.utils.BN(await oracle.price1Average.call()).toString();
  console.log("price1Average: ",price1Average); 

  const blockTimestampLast = web3.utils.BN(await oracle.blockTimestampLast.call()).toString();
  console.log("blockTimestampLast: ",blockTimestampLast); 

  const nextEpochPoint = await oracle.nextEpochPoint();
  console.log("nextEpochPoint: ",nextEpochPoint.toString());






  // const amountIn = web3.utils.toBN(10 ** 18);
  // const price = web3.utils.BN(await oracle.consult(token0,amountIn)).toString();
  // console.log("oracle.consult result is: ",price);



}