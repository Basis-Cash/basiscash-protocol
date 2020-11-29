const Distributor = artifacts.require('Distributor');
const InitialCashDistributor = artifacts.require('InitialCashDistributor');
const InitialShareDistributor = artifacts.require('InitialShareDistributor');

module.exports = async (deployer, network, accounts) => {
  const distributors = await Promise.all(
    [
      InitialCashDistributor,
      InitialShareDistributor,
    ].map(distributor => distributor.deployed())
  );

  await deployer.deploy(
    Distributor,
    distributors.map(contract => contract.address),
  );
  const distributor = await Distributor.deployed();

  console.log(`Distributor manager contract is ${distributor.address}`)
}
