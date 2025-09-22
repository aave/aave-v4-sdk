import {
  SigningError,
  TransactionError,
  UnexpectedError,
} from '@aave/client-next';
import { permitTypedData } from '@aave/client-next/actions';
import type {
  CancelSwapTypedData,
  ERC712Signature,
  PermitTypedDataRequest,
  SwapByIntentTypedData,
  TransactionRequest,
} from '@aave/graphql-next';
import {
  invariant,
  okAsync,
  ResultAsync,
  signatureFrom,
  txHash,
} from '@aave/types-next';
import { defineChain, type ThirdwebClient } from 'thirdweb';
import {
  useActiveAccount,
  useSendAndConfirmTransaction,
  useSwitchActiveWalletChain,
} from 'thirdweb/react';
import { useAaveClient } from './context';
import { type UseAsyncTask, useAsyncTask } from './helpers/tasks';
import type { UseSendTransactionResult } from './helpers/writes';

/**
 * A hook that provides a way to send Aave transactions using a Thirdweb wallet.
 *
 * Import the `useSendTransaction` hook from `@aave/react/thirdweb` entry point.
 */
export function useSendTransaction(
  thirdwebClient: ThirdwebClient,
): UseSendTransactionResult {
  const client = useAaveClient();
  const switchChain = useSwitchActiveWalletChain();
  const { mutateAsync: sendAndConfirmTx } = useSendAndConfirmTransaction();

  return useAsyncTask((request: TransactionRequest) => {
    return ResultAsync.fromPromise(
      switchChain(defineChain({ id: request.chainId })),
      (err) => UnexpectedError.from(err),
    )
      .andThen(() =>
        ResultAsync.fromPromise(
          sendAndConfirmTx({
            to: request.to,
            data: request.data,
            value: BigInt(request.value),
            chain: {
              id: request.chainId,
              rpc: `https://${request.chainId}.rpc.thirdweb.com/${thirdwebClient.clientId}`,
            },
            client: thirdwebClient,
          }),
          (err) => SigningError.from(err),
        ),
      )
      .andThen((receipt) =>
        receipt.status === 'reverted'
          ? TransactionError.new({
              txHash: txHash(receipt.transactionHash),
              request,
            }).asResultAsync()
          : okAsync(txHash(receipt.transactionHash)),
      )
      .map((hash) => ({
        operations: request.operations,
        txHash: hash,
      }))
      .andThen(client.waitForSupportedTransaction);
  });
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using a Thirdweb wallet.
 *
 * ```ts
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit();
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     chainId: chainId(1), // Ethereum mainnet
 *     market: evmAddress('0x1234…'),
 *     underlyingToken: evmAddress('0x5678…'),
 *     amount: '42.42',
 *     spender: evmAddress('0x9abc…'),
 *     owner: evmAddress(account.address!),
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
export function useERC20Permit(): UseAsyncTask<
  PermitTypedDataRequest,
  ERC712Signature,
  SignERC20PermitError
> {
  const client = useAaveClient();
  const account = useActiveAccount();

  return useAsyncTask((request: PermitTypedDataRequest) => {
    invariant(
      account,
      'No Account found. Ensure you have connected your wallet.',
    );

    return permitTypedData(client, request).andThen((result) =>
      ResultAsync.fromPromise(
        account.signTypedData({
          // silence the rest of the type inference
          types: result.types as Record<string, unknown>,
          domain: result.domain,
          primaryType: result.primaryType,
          message: result.message,
        }),
        (err) => SigningError.from(err),
      ).map((signature) => {
        return {
          deadline: result.message.deadline,
          value: signatureFrom(signature),
        };
      }),
    );
  });
}

export type SignSwapTypedDataError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign swap typed data using a Thirdweb wallet.
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
  const account = useActiveAccount();

  return useAsyncTask(
    (typedData: SwapByIntentTypedData | CancelSwapTypedData) => {
      invariant(account, 'Expected an active account to sign swap typed data');

      const message = JSON.parse(typedData.message);

      return ResultAsync.fromPromise(
        account.signTypedData({
          // silence the rest of the type inference
          types: typedData.types as Record<string, unknown>,
          domain: typedData.domain,
          primaryType: typedData.primaryType,
          message,
        }),
        (err) => SigningError.from(err),
      ).map((signature) => ({
        deadline: message.deadline,
        value: signatureFrom(signature),
      }));
    },
  );
}
