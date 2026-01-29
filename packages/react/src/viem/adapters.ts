import {
  invariant,
  type Signature,
  type SignTypedDataError,
  type TransactionRequest,
  type TypedData,
} from '@aave/client';
import {
  ensureChain,
  sendTransaction,
  signTypedDataWith,
  waitForTransactionResult,
} from '@aave/client/viem';
import type { WalletClient } from 'viem';
import { useAaveClient } from '../context';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from '../helpers';

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
  const client = useAaveClient();

  return useAsyncTask(
    (request: TransactionRequest) => {
      invariant(
        walletClient,
        'Expected a WalletClient to handle the operation result.',
      );

      return ensureChain(client, walletClient, request)
        .andThen(() => sendTransaction(walletClient, request))
        .map(
          (hash) =>
            new PendingTransaction(() =>
              waitForTransactionResult(walletClient, request, hash),
            ),
        );
    },
    [client, walletClient],
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
): UseAsyncTask<TypedData, Signature, SignTypedDataError> {
  return useAsyncTask(
    (typedData: TypedData) => {
      invariant(walletClient, 'Expected a WalletClient to sign typed data');

      return signTypedDataWith(walletClient, typedData);
    },
    [walletClient],
  );
}
