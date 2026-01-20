import {
  SigningError,
  type SignTypedDataError,
  type TypedData,
  UnexpectedError,
} from '@aave/client';
import {
  sendTransaction,
  supportedChains,
  waitForTransactionResult,
} from '@aave/client/viem';
import type { TransactionRequest } from '@aave/graphql';
import {
  invariant,
  ResultAsync,
  type Signature,
  signatureFrom,
} from '@aave/types';
import {
  type MessageTypes,
  useSignTypedData as usePrivySignTypedData,
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
 * A hook that provides a way to sign EIP-712 typed data (ERC-20 permits, swap intents, etc.)
 * using a Privy wallet.
 *
 * ```ts
 * const [signTypedData, { loading, error, data }] = useSignTypedData();
 * ```
 */
export function useSignTypedData(): UseAsyncTask<
  TypedData,
  Signature,
  SignTypedDataError
> {
  const { signTypedData: privySignTypedData } = usePrivySignTypedData();

  return useAsyncTask(
    (typedData: TypedData) => {
      return ResultAsync.fromPromise(
        privySignTypedData({
          domain: typedData.domain,
          types: typedData.types as MessageTypes,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
        (error) => SigningError.from(error),
      ).map(({ signature }) => signatureFrom(signature));
    },
    [privySignTypedData],
  );
}
