
const Distributor = artifacts.require('Distributor');
const InitialCashDistributor = artifacts.require('InitialCashDistributor');
const InitialShareDistributor = artifacts.require('InitialShareDistributor');

module.exports = async (deployer, network, accounts) => {
  const initialCashDistributor = await InitialCashDistributor.deployed();
  const initialShareDistributor = await InitialShareDistributor.deployed();

  await deployer.deploy(
    Distributor,
    [
      initialCashDistributor,
      initialShareDistributor,
    ]
  );
  const distributor = await Distributor.deployed();

  console.log(`Distributor manager contract is ${distributor.address}`)
}
