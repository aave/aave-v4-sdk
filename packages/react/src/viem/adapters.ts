import type {
  SignERC20PermitError,
  SignSwapTypedDataError,
} from '@aave/client';
import {
  ensureChain,
  sendTransaction,
  signERC20PermitWith,
  signSwapTypedDataWith,
  waitForTransactionResult,
} from '@aave/client/viem';
import type {
  ERC20PermitSignature,
  PermitTypedData,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import { invariant, type Signature } from '@aave/types';
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
 * A hook that provides a way to sign ERC20 permits using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signERC20Permit, { loading, error, data }] = useSignERC20Permit(wallet);
 * ```
 */
export function useSignERC20Permit(
  walletClient: WalletClient | null | undefined,
): UseAsyncTask<PermitTypedData, ERC20PermitSignature, SignERC20PermitError> {
  return useAsyncTask(
    (data: PermitTypedData) => {
      invariant(walletClient, 'Expected a WalletClient to sign ERC20 permits');

      return signERC20PermitWith(walletClient, data);
    },
    [walletClient],
  );
}

/**
 * A hook that provides a way to sign swap typed data using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedData(wallet);
 * ```
 */
export function useSignSwapTypedData(
  walletClient: WalletClient | null | undefined,
): UseAsyncTask<SwapTypedData, Signature, SignSwapTypedDataError> {
  return useAsyncTask(
    (typedData: SwapTypedData) => {
      invariant(
        walletClient,
        'Expected a WalletClient to sign swap typed data',
      );

      return signSwapTypedDataWith(walletClient, typedData);
    },
    [walletClient],
  );
}
