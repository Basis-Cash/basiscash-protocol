import { ParamType } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

export function encodeParameters(
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

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
