import 'viem/window';

import { evmAddress, nonNullable } from '@aave/client';
import { chain } from '@aave/client/actions';
import { toViemChain } from '@aave/client/viem';
import { type Address, createWalletClient, custom } from 'viem';
import { client } from './client';
import * as config from './config';

const [address]: [Address] = await window.ethereum!.request({
  method: 'eth_requestAccounts',
});

// Note: either use the viem/wagmi chain relevant for your configuration (e.g., mainnet)
// or do this as part of your SSR phase so that this is available ASAP on the client
const viemChain = await chain(client, { chainId: config.chainId })
  .map(nonNullable)
  .map(toViemChain)
  .unwrapOr(undefined);

export const walletClient = createWalletClient({
  account: address,
  chain: viemChain,
  transport: custom(window.ethereum!),
});

const chainId = await walletClient.getChainId();

if (chainId !== config.chainId) {
  try {
    await walletClient.switchChain({ id: chainId });
  } catch {
    await walletClient.addChain({ chain: viemChain! });
  }
}

export const user = evmAddress(address);
