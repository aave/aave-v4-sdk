import { SafeAppProvider } from '@safe-global/safe-apps-provider';
import { useMemo } from 'react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import type { SafeAppState } from './useSafeApp';

export function useSafeWalletClient({
  connected,
  safe,
  sdk,
}: Pick<SafeAppState, 'connected' | 'safe' | 'sdk'>): WalletClient | null {
  return useMemo(() => {
    if (!connected || !safe || safe.chainId !== mainnet.id) {
      return null;
    }

    const provider = new SafeAppProvider(safe, sdk);

    return createWalletClient({
      account: safe.safeAddress as `0x${string}`,
      chain: mainnet,
      transport: custom(provider),
    });
  }, [connected, safe, sdk]);
}
