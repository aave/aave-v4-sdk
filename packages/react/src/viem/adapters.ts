import type { SigningError, UnexpectedError } from '@aave/client';
import {
  ensureChain,
  sendTransaction,
  signERC20PermitWith,
  signSwapTypedDataWith,
  waitForTransactionResult,
} from '@aave/client/viem';
import type {
  ERC20PermitSignature,
  PermitRequest,
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
import { usePermitTypedDataAction } from '../permits';

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
 *     supply: {
 *       sender: evmAddress(wallet.account.address), // User's address
 *       reserve: {
 *         reserveId: reserve.id,
 *         chainId: reserve.chain.chainId,
 *         spoke: reserve.spoke.address,
 *       },
 *       amount: {
 *         value: bigDecimal(42), // 42 USDC
 *       },
 *     },
 *   });
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('ERC20 Permit signature:', result.value);
 * };
 * ```
 */
export function useERC20Permit(
  walletClient: WalletClient | null | undefined,
): UseAsyncTask<PermitRequest, ERC20PermitSignature, SignERC20PermitError> {
  const [permitTypedData] = usePermitTypedDataAction();

  return useAsyncTask(
    (request: PermitRequest) => {
      invariant(walletClient, 'Expected a WalletClient to sign ERC20 permits');

      return permitTypedData(request).andThen(
        signERC20PermitWith(walletClient),
      );
    },
    [permitTypedData, walletClient],
  );
}

export type SignSwapTypedDataError = SigningError | UnexpectedError;

/**
 * @internal
 * A hook that provides a way to sign swap typed data using a viem WalletClient instance.
 *
 * ```ts
 * const { data: wallet } = useWalletClient(); // wagmi hook
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedDataWith(wallet);
 *
 * const run = async () => {
 *   const result = await signSwapTypedData(swapTypedData);
 *
 *   if (result.isErr()) {
 *     console.error(result.error);
 *     return;
 *   }
 *
 *   console.log('Swap typed data signed:', result.value);
 * };
 * ```
 */
export function useSignSwapTypedDataWith(
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
