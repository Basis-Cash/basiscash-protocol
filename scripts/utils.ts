import { ParamType } from 'ethers/lib/utils';

export function encodeParameters(
  ethers: any,
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

export async function wait(
  ethers: any,
  hash: string,
  desc?: string,
  confirmation: number = 1
): Promise<void> {
  if (desc) {
    console.log(`Waiting tx ${hash}. action = ${desc}\n`);
  } else {
    console.log(`Waiting tx ${hash}\n`);
  }
  await ethers.provider.waitForTransaction(hash, confirmation);
}
