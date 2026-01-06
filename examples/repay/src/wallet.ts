import 'viem/window';

import { supportedChains } from '@aave/react/viem';
import { type Address, createWalletClient, custom } from 'viem';

const defaultChain = supportedChains[0]!;

const [address]: [Address] = await window.ethereum!.request({
  method: 'eth_requestAccounts',
});

export const walletClient = createWalletClient({
  account: address,
  chain: defaultChain,
  transport: custom(window.ethereum!),
});

const chainId = await walletClient.getChainId();

if (chainId !== defaultChain.id) {
  try {
    await walletClient.switchChain({ id: defaultChain.id });
  } catch {
    await walletClient.addChain({ chain: defaultChain });
  }
}

export { address };
