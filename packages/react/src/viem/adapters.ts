import {
  type BatchUnavailable,
  isBatchUnavailable,
  type SignTypedDataError,
  type TypedData,
} from '@aave/client';
import {
  canSendCalls,
  ensureChain,
  getWalletCapabilities,
  sendCalls,
  sendTransaction,
  signTypedDataWith,
  toViemChain,
  waitForSentCalls,
  waitForTransactionResult,
} from '@aave/client/viem';
import { UnexpectedError } from '@aave/core';
import type { TransactionRequest } from '@aave/graphql';
import {
  type ChainId,
  invariant,
  okAsync,
  type ResultAsync,
  type Signature,
} from '@aave/types';
import { useMemo } from 'react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import {
  type BatchRequest,
  type BatchSender,
  PendingTransaction,
  type SendTransactionError,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from '../helpers';
import { useChainAction } from '../misc';

/**
 * A hook that provides a way to send Aave transactions using a viem WalletClient instance.
 *
 * Use the `useWalletClient` wagmi hook to get the `WalletClient` instance, then pass it to this hook to create a function that can be used to send transactions.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 *
 * const [sendTransaction] = useSendTransaction(wallet);
 * ```
 *
 * @param walletClient - The wallet client to use for sending transactions.
 */
export function useSendTransaction(
  walletClient: WalletClient | null | undefined,
): UseSendTransactionResult {
  const [fetchChain] = useChainAction();

  return useAsyncTask(
    (request: TransactionRequest) => {
      invariant(
        walletClient,
        'Expected a WalletClient to handle the operation result.',
      );

      return fetchChain({ chainId: request.chainId })
        .map((chain) => {
          invariant(chain, `Chain ${request.chainId} is not supported`);
          return toViemChain(chain);
        })
        .andThen((viemChain) =>
          ensureChain(walletClient, viemChain)
            // Probe with the client the hook received, so the capability cache
            // survives the per-send client created below.
            .andThen(() => getWalletCapabilities(walletClient, request.chainId))
            .andThen((capabilities) => {
              const chainClient = createWalletClient({
                account: walletClient.account,
                chain: viemChain,
                transport: custom({
                  request: (args) => walletClient.request(args),
                }),
              });

              if (!canSendCalls(capabilities)) {
                return sendTransaction(chainClient, request).map(
                  (hash) =>
                    new PendingTransaction(() =>
                      waitForTransactionResult(chainClient, request, hash),
                    ),
                );
              }

              return sendCalls(chainClient, [request]).andThen((id) => {
                // A single call is never sent atomically, so this can't happen.
                if (isBatchUnavailable(id)) {
                  return UnexpectedError.from(
                    'Unexpected BatchUnavailable for a single call',
                  ).asResultAsync();
                }
                return okAsync(
                  new PendingTransaction(
                    waitForSentCalls(chainClient, [request], id),
                  ),
                );
              });
            }),
        );
    },
    [walletClient, fetchChain],
  );
}

/**
 * A hook that provides a way to sign EIP-712 typed data (ERC-20 permits, swap intents, etc.)
 * using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signTypedData, { loading, error, data }] = useSignTypedData(wallet);
 * ```
 */
export function useSignTypedData(
  walletClient: WalletClient | null | undefined,
): UseAsyncTask<TypedData, Signature, SignTypedDataError | UnexpectedError> {
  const [fetchChain] = useChainAction();

  return useAsyncTask(
    (typedData: TypedData) => {
      invariant(walletClient, 'Expected a WalletClient to sign typed data');

      // Wallets validate that the EIP-712 `domain.chainId` matches the active
      // chain before signing (e.g. MetaMask throws "Provided chainId ... must
      // match the active chainId ..."), so switch the wallet first — mirroring
      // `useSendTransaction`.
      return fetchChain({ chainId: typedData.domain.chainId })
        .map((chain) => {
          invariant(
            chain,
            `Chain ${typedData.domain.chainId} is not supported`,
          );
          return toViemChain(chain);
        })
        .andThen((viemChain) =>
          ensureChain(walletClient, viemChain).andThen(() =>
            signTypedDataWith(walletClient, typedData),
          ),
        );
    },
    [walletClient, fetchChain],
  );
}

/**
 * A hook that provides a way to send approval or pre-contract-action steps together
 * with the original transaction as one atomic batch (EIP-5792 `wallet_sendCalls`),
 * using a viem WalletClient instance.
 *
 * Pass the result to a hook as `{ batch }` and send the `BatchRequest` the handler
 * receives with `batch.send(plan)`. Batching only happens when the wallet reports
 * atomic support for the chain; otherwise the hook sends the steps one by one.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 *
 * const [sendTransaction] = useSendTransaction(wallet);
 * const batch = useSendCalls(wallet);
 *
 * const [supply] = useSupply(
 *   (plan) => {
 *     switch (plan.__typename) {
 *       case 'BatchRequest':
 *         return batch.send(plan);
 *       // …other steps as with useSendTransaction
 *     }
 *   },
 *   { batch },
 * );
 * ```
 *
 * @param walletClient - The wallet client to use for sending the batch.
 */
export function useSendCalls(
  walletClient: WalletClient | null | undefined,
): BatchSender {
  const [fetchChain] = useChainAction();

  return useMemo<BatchSender>(
    () => ({
      supports: (chainId: ChainId): ResultAsync<boolean, never> =>
        walletClient
          ? getWalletCapabilities(walletClient, chainId).map(canSendCalls)
          : okAsync(false),

      send: (
        plan: BatchRequest,
      ): ResultAsync<
        PendingTransaction | BatchUnavailable,
        SendTransactionError
      > => {
        invariant(
          walletClient,
          'Expected a WalletClient to handle the operation result.',
        );
        const [first] = plan.requests;
        invariant(first, 'Expected at least one transaction request');

        return fetchChain({ chainId: first.chainId })
          .map((chain) => {
            invariant(chain, `Chain ${first.chainId} is not supported`);
            return toViemChain(chain);
          })
          .andThen((viemChain) =>
            ensureChain(walletClient, viemChain).andThen(() => {
              const chainClient = createWalletClient({
                account: walletClient.account,
                chain: viemChain,
                transport: custom({
                  request: (args) => walletClient.request(args),
                }),
              });

              return sendCalls(chainClient, plan.requests).map((id) =>
                isBatchUnavailable(id)
                  ? id
                  : new PendingTransaction(
                      waitForSentCalls(chainClient, plan.requests, id),
                    ),
              );
            }),
          );
      },
    }),
    [walletClient, fetchChain],
  );
}
