import {
  type BatchUnavailable,
  type TransactionReceipt,
  UnexpectedError,
} from '@aave/client';
import { borrow } from '@aave/client/actions';
import { ValidationError } from '@aave/core';
import type {
  BorrowRequest,
  InsufficientBalanceError,
  PreContractActionRequired,
  TransactionRequest,
} from '@aave/graphql';
import { errAsync, okAsync } from '@aave/types';

import { useAaveClient } from '../context';
import {
  type BatchOptions,
  type BatchRequest,
  cancel,
  type ExecutionPlanHandler,
  type PendingTransaction,
  type PendingTransactionError,
  refreshQueriesForReserveChange,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';
import { asStepHandler, type MaybeBatchHandler, sendAsBatch } from './batch';

type BorrowStep = TransactionRequest | PreContractActionRequired;

type BorrowResult = UseAsyncTask<
  BorrowRequest,
  TransactionReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError>
>;

/**
 * A hook that provides a way to borrow assets from an Aave reserve.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [borrow, { loading, error }] = useBorrow((plan, { cancel }) => {
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
 * const result = await borrow({ ... });
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
export function useBorrow(
  handler: ExecutionPlanHandler<BorrowStep, PendingTransaction>,
): BorrowResult;
/**
 * A hook that provides a way to borrow assets from an Aave reserve, sending a pre-contract action (e.g. approving
 * the native gateway as position manager) together with the transaction as one atomic
 * batch when the wallet supports it.
 *
 * The handler then also receives a `BatchRequest`, which it sends with `batch.send`.
 * See `useSupply` for an example.
 *
 * @param handler - The handler that will be used to handle the transactions.
 * @param options - The batch sender to use.
 */
export function useBorrow(
  handler: ExecutionPlanHandler<
    BorrowStep | BatchRequest,
    PendingTransaction | BatchUnavailable
  >,
  options: BatchOptions,
): BorrowResult;
export function useBorrow(
  handler: MaybeBatchHandler<BorrowStep, PendingTransaction>,
  options?: BatchOptions,
): BorrowResult {
  const client = useAaveClient();
  const batch = options?.batch;

  return useAsyncTask(
    (request: BorrowRequest) => {
      const steps = asStepHandler(handler);

      return borrow(client, request)
        .andThen((plan) => {
          switch (plan.__typename) {
            case 'TransactionRequest':
              return steps(plan, { cancel });

            case 'PreContractActionRequired':
              return sendAsBatch(plan, handler, batch).andThen((pending) =>
                pending
                  ? okAsync(pending)
                  : steps(plan, { cancel })
                      .andThen((pending) => pending.wait())
                      .andThen(() =>
                        steps(plan.originalTransaction, { cancel }),
                      ),
              );

            case 'InsufficientBalanceError':
              return errAsync(ValidationError.fromGqlNode(plan));

            case 'Erc20ApprovalRequired':
              return UnexpectedError.from(plan).asResultAsync();
          }
        })
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() => refreshQueriesForReserveChange(client, request));
    },
    [client, handler, batch],
  );
}
