import type { SigningError, UnexpectedError } from '@aave/client-next';
import { permitTypedData } from '@aave/client-next/actions';
import {
  sendTransactionAndWait,
  signERC20PermitWith,
  signSwapByIntentWith,
  signSwapCancelWith,
} from '@aave/client-next/viem';
import type {
  CancelSwapTypedData,
  ERC712Signature,
  PermitTypedDataRequest,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql-next';
import { invariant } from '@aave/types-next';
import type { WalletClient } from 'viem';
import { useAaveClient } from './context';
import {
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';

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
  walletClient: WalletClient | undefined,
): UseSendTransactionResult {
  const client = useAaveClient();

  return useAsyncTask((request: TransactionRequest) => {
    invariant(
      walletClient,
      'Expected a WalletClient to handle the operation result.',
    );

    return sendTransactionAndWait(walletClient, request).andThen(
      client.waitForSupportedTransaction,
    );
  });
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit(wallet);
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     chainId: chainId(1), // Ethereum mainnet
 *     market: evmAddress('0x1234…'),
 *     user: evmAddress(account.address!),
 *   });
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('ERC20 permit signed:', result.value);
 * };
 * ```
 */
export function useERC20Permit(
  walletClient: WalletClient | undefined,
): UseAsyncTask<PermitTypedDataRequest, ERC712Signature, SignERC20PermitError> {
  const client = useAaveClient();

  return useAsyncTask((request: PermitTypedDataRequest) => {
    invariant(walletClient, 'Expected a WalletClient to sign ERC20 permits');

    return permitTypedData(client, request).andThen(
      signERC20PermitWith(walletClient),
    );
  });
}

export type SignSwapError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign swap by intent using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signSwapByIntent, { loading, error, data }] = useSignSwapByIntentWith(wallet);
 *
 * const run = async () => {
 *   const result = await signSwapByIntent(swapByIntentTypedData);
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Swap by intent signed:', result.value);
 * };
 * ```
 */
export function useSignSwapByIntentWith(
  walletClient: WalletClient | undefined,
): UseAsyncTask<SwapByIntentTypedData, ERC712Signature, SignSwapError> {
  return useAsyncTask((typedData: SwapByIntentTypedData) => {
    invariant(walletClient, 'Expected a WalletClient to sign swap by intent');

    return signSwapByIntentWith(walletClient)(typedData);
  });
}

/**
 * A hook that provides a way to sign swap cancellation using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signSwapCancel, { loading, error, data }] = useSignSwapCancelWith(wallet);
 *
 * const run = async () => {
 *   const result = await signSwapCancel(cancelSwapTypedData);
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Swap cancellation signed:', result.value);
 * };
 * ```
 */
export function useSignSwapCancelWith(
  walletClient: WalletClient | undefined,
): UseAsyncTask<CancelSwapTypedData, ERC712Signature, SignSwapError> {
  return useAsyncTask((typedData: CancelSwapTypedData) => {
    invariant(
      walletClient,
      'Expected a WalletClient to sign swap cancellation',
    );

    return signSwapCancelWith(walletClient)(typedData);
  });
}
