import { Block, Web3Provider } from '@ethersproject/providers';

export async function advanceTime(
  { provider }: Web3Provider,
  time: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!provider?.sendAsync) {
      reject(new Error('sendAsync undefined'));
    } else {
      provider.sendAsync(
        { method: 'evm_increaseTime', params: [time] },
        (error: any, result: any): void => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    }
  });
}

export async function advanceBlock(provider: Web3Provider): Promise<Block> {
  return new Promise(async (resolve, reject) => {
    if (!provider?.provider?.sendAsync) {
      reject(new Error('sendAsync undefined'));
    } else {
      provider.provider.sendAsync(
        { method: 'evm_mine' },
        (error: any, result: any): void => {
          if (error) {
            reject(error);
          }
          provider
            .getBlock('latest')
            .then((block) => resolve(block))
            .catch((err) => reject(err));
        }
      );
    }
  });
}

export async function advanceTimeAndBlock(
  provider: Web3Provider,
  time: number
): Promise<Block> {
  await advanceTime(provider, time);
  await advanceBlock(provider);
  return Promise.resolve(provider.getBlock('latest'));
}
