import type { TransactionReceipt } from '@aave/client';
import { renounceSpokeUserPositionManager } from '@aave/client/actions';
import type {
  RenounceSpokeUserPositionManagerRequest,
  TransactionRequest,
} from '@aave/graphql';

import { useAaveClient } from '../context';
import {
  cancel,
  type ExecutionPlanHandler,
  type PendingTransaction,
  type PendingTransactionError,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';

import { refreshSpokePositionManagers } from './cache';

/**
 * A hook that provides a way to renounce a position manager of a user for a specific spoke.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [renounceSpokeUserPositionManager, { loading, error }] = useRenounceSpokeUserPositionManager(sendTransaction);
 *
 * // …
 *
 * const result = await renounceSpokeUserPositionManager({ ... });
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

export function useRenounceSpokeUserPositionManager(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  RenounceSpokeUserPositionManagerRequest,
  TransactionReceipt,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: RenounceSpokeUserPositionManagerRequest) =>
      renounceSpokeUserPositionManager(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() => refreshSpokePositionManagers(client, request.spoke)),
    [client, handler],
  );
}
