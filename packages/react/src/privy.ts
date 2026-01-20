import {
  type SignERC20PermitError,
  SigningError,
  type SignSwapTypedDataError,
  UnexpectedError,
} from '@aave/client';
import {
  sendTransaction,
  supportedChains,
  waitForTransactionResult,
} from '@aave/client/viem';
import type {
  ERC20PermitSignature,
  PermitTypedData,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  invariant,
  ResultAsync,
  type Signature,
  signatureFrom,
} from '@aave/types';
import {
  type MessageTypes,
  useSignTypedData,
  useWallets,
} from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';

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

  return useAsyncTask(
    (request: TransactionRequest) => {
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
    },
    [wallets],
  );
}

/**
 * A hook that provides a way to sign ERC20 permits using a Privy wallet.
 *
 * ```ts
 * const [signERC20Permit, { loading, error, data }] = useSignERC20Permit();
 * ```
 */
export function useSignERC20Permit(): UseAsyncTask<
  PermitTypedData,
  ERC20PermitSignature,
  SignERC20PermitError
> {
  const { signTypedData } = useSignTypedData();

  return useAsyncTask(
    (data: PermitTypedData) => {
      return ResultAsync.fromPromise(
        signTypedData({
          types: data.types,
          primaryType: data.primaryType,
          domain: data.domain,
          message: data.message,
        }),
        (error) => SigningError.from(error),
      ).map(({ signature }) => ({
        deadline: data.message.deadline,
        value: signatureFrom(signature),
      }));
    },
    [signTypedData],
  );
}

/**
 * A hook that provides a way to sign swap typed data using a Privy wallet.
 *
 * ```ts
 * const [signSwapTypedData, { loading, error, data }] = useSignSwapTypedData();
 * ```
 */
export function useSignSwapTypedData(): UseAsyncTask<
  SwapTypedData,
  Signature,
  SignSwapTypedDataError
> {
  const { signTypedData } = useSignTypedData();

  return useAsyncTask(
    (typedData: SwapTypedData) => {
      return ResultAsync.fromPromise(
        signTypedData({
          domain: typedData.domain,
          types: typedData.types as MessageTypes,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
        (error) => SigningError.from(error),
      ).map(({ signature }) => signatureFrom(signature));
    },
    [signTypedData],
  );
}
