import type {
  SignTypedDataError,
  TransactionBatch,
  TypedData,
  UnexpectedError,
} from '@aave/client';
import { ensureChain, signTypedDataWith, toViemChain } from '@aave/client/viem';
import type { TransactionRequest } from '@aave/graphql';
import { invariant, type Signature } from '@aave/types';
import { createWalletClient, custom, type WalletClient } from 'viem';
import {
  type UseAsyncTask,
  type UseSendTransactionOrBatchResult,
  useAsyncTask,
} from '../helpers';
import { useChainAction } from '../misc';
import { send } from './send';

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
 * With a Smart Account (e.g. a Safe multisig), the transaction stays pending
 * until it is executed on-chain.
 * If it is not on-chain after 30 minutes, it fails with a
 * `SubmissionUnresolvedError`. It may still go through, so check
 * `SubmissionUnresolvedError.is(error)` and do not resend it automatically.
 *
 * It also sends a `TransactionBatch` as one atomic `wallet_sendCalls` prompt.
 *
 * @param walletClient - The wallet client to use for sending transactions.
 */
export function useSendTransaction(
  walletClient: WalletClient | null | undefined,
): UseSendTransactionOrBatchResult {
  const [fetchChain] = useChainAction();

  return useAsyncTask(
    (request: TransactionRequest | TransactionBatch) => {
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
            .map(() =>
              createWalletClient({
                account: walletClient.account,
                chain: viemChain,
                transport: custom({
                  request: (args) => walletClient.request(args),
                }),
              }),
            )
            .andThen((walletClient) => send(walletClient, request)),
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
