import type { BatchCapability } from '@aave/client';
import { canBatch } from '@aave/client/viem';
import { type ChainId, okAsync } from '@aave/types';
import { useEffect, useState } from 'react';
import type { WalletClient } from 'viem';

/**
 * Creates a {@link BatchCapability} for a write hook's `batch` option.
 *
 * Every call asks the wallet afresh, so the answer reflects the wallet the
 * user has connected right now.
 *
 * ```ts
 * const { data: walletClient } = useWalletClient(); // wagmi hook
 *
 * const [supply] = useSupply(handler, {
 *   batch: batchingEnabled ? batchCapability(walletClient) : undefined,
 * });
 * ```
 *
 * @param walletClient - The wallet client the plan will be sent with.
 */
export function batchCapability(
  walletClient: WalletClient | null | undefined,
): BatchCapability {
  return (chainId) =>
    walletClient ? canBatch(walletClient, { chainId }) : okAsync(false);
}

/**
 * How long a wallet's answer is reused before asking again.
 *
 * @internal
 */
export const CAN_BATCH_STALE_TIME = 30_000;

type CachedAnswer = { value: Promise<boolean>; at: number };

const answers = new Map<string, CachedAnswer>();

// the same account can live in two wallets that answer differently
function keyOf(walletClient: WalletClient, chainId: ChainId): string {
  return `${walletClient.uid}:${walletClient.account?.address}:${chainId}`;
}

function cachedCanBatch(
  walletClient: WalletClient,
  chainId: ChainId,
): Promise<boolean> {
  const key = keyOf(walletClient, chainId);
  const cached = answers.get(key);

  if (cached && Date.now() - cached.at < CAN_BATCH_STALE_TIME) {
    return cached.value;
  }

  const value = canBatch(walletClient, { chainId }).unwrapOr(false);
  answers.set(key, { value, at: Date.now() });
  return value;
}

/**
 * @internal
 */
export function clearCanBatchCache(): void {
  answers.clear();
}

/**
 * Tells whether the wallet can send a multi-step plan as one atomic batch on
 * the given chain, e.g. to show "Approve & supply" as a single step in a
 * preview.
 *
 * It is `false` until the wallet has answered. Answers are cached per wallet,
 * account and chain for a short time. Sending does not rely on this value: a write
 * hook's `batch` option checks the wallet again.
 *
 * ```ts
 * const { data: walletClient } = useWalletClient(); // wagmi hook
 *
 * const canBatch = useCanBatch(walletClient, { chainId: reserve.chain.chainId });
 * ```
 *
 * @param walletClient - The wallet client the plan will be sent with.
 * @param options - The chain the plan will be sent on.
 */
export function useCanBatch(
  walletClient: WalletClient | null | undefined,
  { chainId }: { chainId: ChainId },
): boolean {
  const [answer, setAnswer] = useState<{ key: string; value: boolean }>();
  const key = walletClient ? keyOf(walletClient, chainId) : undefined;

  useEffect(() => {
    if (!walletClient || !key) return;

    let current = true;
    void cachedCanBatch(walletClient, chainId).then((value) => {
      if (current) setAnswer({ key, value });
    });
    return () => {
      current = false;
    };
  }, [walletClient, chainId, key]);

  return answer !== undefined && answer.key === key ? answer.value : false;
}
