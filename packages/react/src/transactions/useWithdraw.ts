import { type TransactionReceipt, UnexpectedError } from '@aave/client';
import { withdraw } from '@aave/client/actions';
import { ValidationError } from '@aave/core';
import type {
  InsufficientBalanceError,
  PreContractActionRequired,
  TransactionRequest,
  WithdrawRequest,
} from '@aave/graphql';
import { errAsync } from '@aave/types';

import { useAaveClient } from '../context';
import {
  cancel,
  type ExecutionPlanHandler,
  type PendingTransaction,
  type PendingTransactionError,
  refreshQueriesForReserveChange,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';

/**
 * A hook that provides a way to withdraw supplied assets from an Aave reserve.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [withdraw, { loading, error }] = useWithdraw((plan, { cancel }) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'PreContractActionRequired':
 *       return sendTransaction(plan.transaction);
 *   }
 * });
 *
 * // …
 *
 * const result = await withdraw({ ... });
 *
 * if (result.isErr()) {
 *   switch (result.error.name) {
 *     case 'CancelError':
 *       // The user cancelled the operation
 *       return;
 *
 *     case 'SigningError':
 *       console.error(`Failed to sign the transaction: ${result.error.message}`);
 *       break;
 *
 *     case 'TimeoutError':
 *       console.error(`Transaction timed out: ${result.error.message}`);
 *       break;
 *
 *     case 'TransactionError':
 *       console.error(`Transaction failed: ${result.error.message}`);
 *       break;
 *
 *     case 'ValidationError':
 *       console.error(`Insufficient balance: ${result.error.cause.required.value} required.`);
 *       break;
 *
 *     case 'UnexpectedError':
 *       console.error(result.error.message);
 *       break;
 *   }
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value.txHash);
 * ```
 *
 * @param handler - The handler that will be used to handle the transactions.
 */
export function useWithdraw(
  handler: ExecutionPlanHandler<
    TransactionRequest | PreContractActionRequired,
    PendingTransaction
  >,
): UseAsyncTask<
  WithdrawRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: WithdrawRequest) =>
      withdraw(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return handler(plan, { cancel });

            case 'PreContractActionRequired':
              return handler(plan, { cancel })
                .andThen((pending) => pending.wait())
                .andThen(() => handler(plan.originalTransaction, { cancel }));

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));

            case 'Erc20ApprovalRequired':
              return UnexpectedError.from(plan).asResultAsync();
          }
        })
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() => refreshQueriesForReserveChange(client, request)),
    [client, handler],
  );
}
