import type { TransactionReceipt } from '@aave/client';
import { updateUserPositionConditions } from '@aave/client/actions';
import type {
  TransactionRequest,
  UpdateUserPositionConditionsRequest,
} from '@aave/graphql';

import { useAaveClient } from '../context';
import {
  cancel,
  type ExecutionPlanHandler,
  type PendingTransaction,
  type PendingTransactionError,
  refreshUserPositionById,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';

/**
 * Hook for updating user position conditions (dynamic config and/or risk premium).
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [update, { loading, error }] = useUpdateUserPositionConditions((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * // …
 *
 * const result = await update({
 *   userPositionId: userPosition.id,
 *   update: UserPositionConditionsUpdate.AllDynamicConfig,
 * });
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
 * @param handler - The handler that will be used to handle the transaction.
 */

export function useUpdateUserPositionConditions(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  UpdateUserPositionConditionsRequest,
  TransactionReceipt,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UpdateUserPositionConditionsRequest) =>
      updateUserPositionConditions(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() =>
          refreshUserPositionById(client, request.userPositionId),
        ),
    [client, handler],
  );
}
