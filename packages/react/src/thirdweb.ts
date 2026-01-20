import {
  type SignERC20PermitError,
  SigningError,
  type SignSwapTypedDataError,
  TransactionError,
  UnexpectedError,
} from '@aave/client';
import { chain as fetchChain } from '@aave/client/actions';
import { toThirdwebChain } from '@aave/client/thirdweb';
import type {
  ERC20PermitSignature,
  PermitTypedData,
  SwapTypedData,
  TransactionRequest,
} from '@aave/graphql';
import {
  invariant,
  okAsync,
  ResultAsync,
  type Signature,
  signatureFrom,
  txHash,
} from '@aave/types';
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
                (err) => SigningError.from(err),
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
 * A hook that provides a way to sign ERC20 permits using a Thirdweb wallet.
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
  const account = useActiveAccount();

  return useAsyncTask(
    (data: PermitTypedData) => {
      invariant(
        account,
        'No Account found. Ensure you have connected your wallet.',
      );

      return ResultAsync.fromPromise(
        account.signTypedData({
          // silence the rest of the type inference
          types: data.types as Record<string, unknown>,
          domain: data.domain,
          primaryType: data.primaryType,
          message: data.message,
        }),
        (err) => SigningError.from(err),
      ).map((signature) => {
        return {
          deadline: data.message.deadline,
          value: signatureFrom(signature),
        };
      });
    },
    [account],
  );
}

/**
 * A hook that provides a way to sign swap typed data using a Thirdweb wallet.
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
  const account = useActiveAccount();

  return useAsyncTask(
    (typedData: SwapTypedData) => {
      invariant(account, 'Expected an active account to sign swap typed data');

      return ResultAsync.fromPromise(
        account.signTypedData({
          // silence the rest of the type inference
          types: typedData.types as Record<string, unknown>,
          domain: typedData.domain,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
        (err) => SigningError.from(err),
      ).map(signatureFrom);
    },
    [account],
  );
}
