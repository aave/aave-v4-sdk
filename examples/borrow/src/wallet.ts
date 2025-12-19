import 'viem/window';

import { nonNullable } from '@aave/client';
import { chain } from '@aave/client/actions';
import { toViemChain } from '@aave/client/viem';
import { type Address, createWalletClient, custom } from 'viem';
import { client } from './client';
import { defaultChainId } from './config';

const [address]: [Address] = await window.ethereum!.request({
  method: 'eth_requestAccounts',
});

const viemChain = await chain(client, { chainId: defaultChainId })
  .map(nonNullable)
  .map(toViemChain)
  .unwrapOr(undefined);

export const walletClient = createWalletClient({
  account: address,
  chain: viemChain,
  transport: custom(window.ethereum!),
});

const chainId = await walletClient.getChainId();

if (chainId !== defaultChainId) {
  try {
    await walletClient.switchChain({ id: defaultChainId });
  } catch {
    await walletClient.addChain({ chain: viemChain! });
  }
}

export { address };
