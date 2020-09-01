// ============ Contracts ============

// Actors
const Oracle = artifacts.require('Oracle')
const Bond = artifacts.require('Boardroom')
const Share = artifacts.require('')

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network) {
  await deployer.deploy(Cash)
  await deployer.deploy(Bond)
  await deployer.deploy(Share)
}
