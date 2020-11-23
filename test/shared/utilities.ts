import { Block, JsonRpcProvider } from '@ethersproject/providers';

export async function advanceTime(
  provider: JsonRpcProvider,
  time: number
): Promise<void> {
  return provider.send('evm_increaseTime', [time]);
}

export async function advanceBlock(provider: JsonRpcProvider): Promise<Block> {
  await provider.send('evm_mine', []);
  return await provider.getBlock('latest');
}

export async function advanceTimeAndBlock(
  provider: JsonRpcProvider,
  time: number
): Promise<Block> {
  await advanceTime(provider, time);
  await advanceBlock(provider);
  return Promise.resolve(provider.getBlock('latest'));
}
