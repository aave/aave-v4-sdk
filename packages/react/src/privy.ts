import { SigningError, UnexpectedError } from '@aave/client-next';
import {
  sendTransaction,
  supportedChains,
  waitForTransactionResult,
} from '@aave/client-next/viem';
import type {
  CancelSwapTypedData,
  ERC712Signature,
  PermitTypedDataRequest,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql-next';
import { invariant, ResultAsync, signatureFrom } from '@aave/types-next';
import { useSignTypedData, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';
import { usePermitTypedDataAction } from './permits';

/**
 * A hook that provides a way to send Aave transactions using a Privy wallet.
 *
 * Import the `useSendTransaction` hook from `@aave/react/privy` entry point.
 *
 * ```ts
 * const [sendTransaction, { loading, error, data }] = useSendTransaction();
 * ```
 */
export function useSendTransaction(): UseSendTransactionResult {
  const { wallets } = useWallets();

  return useAsyncTask((request: TransactionRequest) => {
    const wallet = wallets.find((wallet) => wallet.address === request.from);

    invariant(
      wallet,
      `Expected a connected wallet with address ${request.from} to be found.`,
    );

    return ResultAsync.fromPromise(
      wallet.switchChain(request.chainId),
      (error) => UnexpectedError.from(error),
    )
      .map(() => wallet.getEthereumProvider())
      .map((provider) =>
        createWalletClient({
          account: request.from,
          chain: supportedChains[request.chainId],
          transport: custom(provider),
        }),
      )
      .andThen((walletClient) =>
        sendTransaction(walletClient, request).map(
          (hash) =>
            new PendingTransaction(() =>
              waitForTransactionResult(walletClient, request, hash),
            ),
        ),
      );
  });
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using a Privy wallet.
 *
 * ```ts
 * const { ready, authenticated, user } = usePrivy(); // privy hook
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit();
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     supply: {
 *       sender: evmAddress(user!.wallet!.address), // User's address
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
export function useERC20Permit(): UseAsyncTask<
  PermitTypedDataRequest,
  ERC712Signature,
  SignERC20PermitError
> {
  const [permitTypedData] = usePermitTypedDataAction();
  const { signTypedData } = useSignTypedData();

  return useAsyncTask((request: PermitTypedDataRequest) => {
    return permitTypedData(request).andThen((response) =>
      ResultAsync.fromPromise(
        signTypedData({
          types: response.types,
          primaryType: response.primaryType,
          domain: response.domain,
          message: response.message,
        }),
        (error) => SigningError.from(error),
      ).map(({ signature }) => ({
        deadline: response.message.deadline,
        value: signatureFrom(signature),
      })),
    );
  });
}

export type SignSwapTypedDataError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign swap typed data using a Privy wallet.
 *
 * ```ts
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedDataWith();
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
export function useSignSwapTypedDataWith(): UseAsyncTask<
  SwapByIntentTypedData | CancelSwapTypedData,
  ERC712Signature,
  SignSwapTypedDataError
> {
  const { signTypedData } = useSignTypedData();

  return useAsyncTask(
    (typedData: SwapByIntentTypedData | CancelSwapTypedData) => {
      const message = JSON.parse(typedData.message);

      return ResultAsync.fromPromise(
        signTypedData({
          types: typedData.types,
          primaryType: typedData.primaryType,
          domain: typedData.domain,
          message,
        }),
        (error) => SigningError.from(error),
      ).map(({ signature }) => ({
        deadline: message.deadline,
        value: signatureFrom(signature),
      }));
    },
  );
}
