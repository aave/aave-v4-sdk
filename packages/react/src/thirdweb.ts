import {
  CancelError,
  invariant,
  okAsync,
  ResultAsync,
  type Signature,
  SigningError,
  type SignTypedDataError,
  signatureFrom,
  TransactionError,
  type TransactionRequest,
  type TypedData,
  txHash,
  UnexpectedError,
} from '@aave/client';
import { chain as fetchChain } from '@aave/client/actions';
import { toThirdwebChain } from '@aave/client/thirdweb';
import {
  prepareTransaction,
  sendTransaction,
  type ThirdwebClient,
  waitForReceipt,
} from 'thirdweb';
import { useActiveAccount, useSwitchActiveWalletChain } from 'thirdweb/react';
import { useAaveClient } from './context';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';

function isUserRejection(err: unknown): boolean {
  if (err && typeof err === 'object') {
    if ('code' in err && err.code === 4001) return true;
    if ('message' in err && typeof err.message === 'string') {
      const msg = err.message.toLowerCase();
      return (
        msg.includes('user rejected') ||
        msg.includes('user denied') ||
        msg.includes('rejected the request')
      );
    }
  }
  return false;
}

/**
 * A hook that provides a way to send Aave transactions using a Thirdweb wallet.
 *
 * Import the `useSendTransaction` hook from `@aave/react/thirdweb` entry point.
 */
export function useSendTransaction(
  thirdwebClient: ThirdwebClient,
): UseSendTransactionResult {
  const client = useAaveClient();
  const account = useActiveAccount();
  const switchChain = useSwitchActiveWalletChain();

  return useAsyncTask(
    (request: TransactionRequest) => {
      invariant(
        account,
        'No Account found. Ensure you have connected your wallet.',
      );

      return fetchChain(
        client,
        { chainId: request.chainId },
        {
          batch: false,
        },
      )
        .map((chain) => {
          invariant(chain, `Chain ${request.chainId} is not supported`);

          return toThirdwebChain(chain);
        })
        .andThen((chain) => {
          return ResultAsync.fromPromise(switchChain(chain), (err) =>
            UnexpectedError.from(err),
          )
            .andThen(() =>
              ResultAsync.fromPromise(
                sendTransaction({
                  account,
                  transaction: prepareTransaction({
                    to: request.to,
                    data: request.data,
                    value: BigInt(request.value),
                    chain,
                    client: thirdwebClient,
                  }),
                }),
                (err) => {
                  if (isUserRejection(err)) {
                    return CancelError.from(err);
                  }
                  return SigningError.from(err);
                },
              ),
            )
            .map(
              ({ transactionHash }) =>
                new PendingTransaction(() =>
                  ResultAsync.fromPromise(
                    waitForReceipt({
                      client: thirdwebClient,
                      chain,
                      transactionHash,
                    }),
                    (err) => UnexpectedError.from(err),
                  ).andThen(({ status, transactionHash }) => {
                    if (status === 'reverted') {
                      return TransactionError.new({
                        txHash: txHash(transactionHash),
                        request,
                      }).asResultAsync();
                    }
                    return okAsync({
                      operations: request.operations,
                      txHash: txHash(transactionHash),
                    });
                  }),
                ),
            );
        });
    },
    [account, client, switchChain, thirdwebClient],
  );
}

/**
 * A hook that provides a way to sign EIP-712 typed data (ERC-20 permits, swap intents, etc.)
 * using a Thirdweb wallet.
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
  const account = useActiveAccount();

  return useAsyncTask(
    (typedData: TypedData) => {
      invariant(account, 'Expected an active account to sign typed data');

      return ResultAsync.fromPromise(
        account.signTypedData({
          // silence the rest of the type inference
          types: typedData.types as Record<string, unknown>,
          domain: typedData.domain,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
        (err) => {
          if (isUserRejection(err)) {
            return CancelError.from(err);
          }
          return SigningError.from(err);
        },
      ).map(signatureFrom);
    },
    [account],
  );
}
