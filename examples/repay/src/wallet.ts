import 'viem/window';

import { supportedChains } from '@aave/react/viem';
import { type Address, createWalletClient, custom } from 'viem';

const chain = supportedChains[0];

const [address]: [Address] = await window.ethereum!.request({
  method: 'eth_requestAccounts',
});

export const walletClient = createWalletClient({
  account: address,
  chain,
  transport: custom(window.ethereum!),
});

const chainId = await walletClient.getChainId();

if (chainId !== chain.id) {
  try {
    await walletClient.switchChain({ id: chain.id });
  } catch {
    await walletClient.addChain({ chain });
  }
}

export { address };
