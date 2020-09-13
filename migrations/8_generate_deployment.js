const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

function distributionPoolContracts() {
    return fs.readdirSync(path.resolve(__dirname, '../contracts/distribution'))
      .filter(filename => filename.endsWith('Pool.sol'))
      .map(filename => filename.replace('.sol', ''));
}

// Deployment and ABI will be generated for contracts listed on here.
// The deployment thus can be used on basiscash-frontend.
const exportedContracts = [
  'Cash',
  'Bond',
  'Share',
  'Boardroom',
  'Treasury',
  ...distributionPoolContracts(),
];

module.exports = async (deployer, network, accounts) => {
  const deployments = {};

  for (const name of exportedContracts) {
    const contract = artifacts.require(name);
    deployments[name] = {
      address: contract.address,
      abi: contract.abi,
    };
  }
  const deploymentPath = path.resolve(__dirname, `../build/deployments.${network}.json`);
  await writeFile(deploymentPath, JSON.stringify(deployments, null, 2));

  console.log(`Exported deployments into ${deploymentPath}`);
};
