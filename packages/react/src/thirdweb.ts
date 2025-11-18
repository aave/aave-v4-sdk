import {
  SigningError,
  TransactionError,
  UnexpectedError,
} from '@aave/client-next';
import type {
  CancelSwapTypedData,
  ERC20PermitSignature,
  PermitRequest,
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
import {
  defineChain,
  prepareTransaction,
  sendTransaction,
  type ThirdwebClient,
  waitForReceipt,
} from 'thirdweb';
import { useActiveAccount, useSwitchActiveWalletChain } from 'thirdweb/react';
import {
  PendingTransaction,
  type UseAsyncTask,
  type UseSendTransactionResult,
  useAsyncTask,
} from './helpers';
import { usePermitTypedDataAction } from './permits';

/**
 * A hook that provides a way to send Aave transactions using a Thirdweb wallet.
 *
 * Import the `useSendTransaction` hook from `@aave/react/thirdweb` entry point.
 */
export function useSendTransaction(
  thirdwebClient: ThirdwebClient,
): UseSendTransactionResult {
  const account = useActiveAccount();
  const switchChain = useSwitchActiveWalletChain();

  return useAsyncTask(
    (request: TransactionRequest) => {
      invariant(
        account,
        'No Account found. Ensure you have connected your wallet.',
      );

      const chain = defineChain({
        id: request.chainId,
        rpc: `https://${request.chainId}.rpc.thirdweb.com/${thirdwebClient.clientId}`,
      });

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
    },
    [account, switchChain, thirdwebClient],
  );
}

export type SignERC20PermitError = SigningError | UnexpectedError;

/**
 * A hook that provides a way to sign ERC20 permits using a Thirdweb wallet.
 *
 * ```ts
 * const account = useActiveAccount(); // thirdweb hook
 * const [signERC20Permit, { loading, error, data }] = useERC20Permit();
 *
 * const run = async () => {
 *   const result = await signERC20Permit({
 *     supply: {
 *       sender: evmAddress(account.address), // User's address
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
  PermitRequest,
  ERC20PermitSignature,
  SignERC20PermitError
> {
  const [permitTypedData] = usePermitTypedDataAction();
  const account = useActiveAccount();

  return useAsyncTask(
    (request: PermitRequest) => {
      invariant(
        account,
        'No Account found. Ensure you have connected your wallet.',
      );

      return permitTypedData(request).andThen((result) =>
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
    },
    [account, permitTypedData],
  );
}

export type SignSwapTypedDataError = SigningError | UnexpectedError;

/**
 * @internal
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
  ERC20PermitSignature,
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
    [account],
  );
}
