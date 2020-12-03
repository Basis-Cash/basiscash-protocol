import { ethers } from 'hardhat';

export async function wait(
  hash: string,
  desc?: string,
  confirmation: number = 1
): Promise<void> {
  if (desc) {
    console.log(`Waiting tx ${hash}. action = ${desc}`);
  } else {
    console.log(`Waiting tx ${hash}`);
  }
  await ethers.provider.waitForTransaction(hash, confirmation);
}
