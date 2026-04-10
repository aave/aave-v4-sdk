import type { TransactionReceipt } from '@aave/client';
import { claimRewards } from '@aave/client/actions';
import type { ClaimRewardsRequest, TransactionRequest } from '@aave/graphql';

import { useAaveClient } from '../context';
import {
  cancel,
  type ExecutionPlanHandler,
  PendingTransaction,
  type PendingTransactionError,
  refreshUserClaimableRewards,
  type SendTransactionError,
  type UseAsyncTask,
  useAsyncTask,
} from '../helpers';

/**
 * A hook that provides a way to claim rewards.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [claim, { loading, error }] = useClaimRewards((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * // …
 *
 * const result = await claim({
 *   ids: [rewardId('abc123')],
 *   chainId: chainId(1),
 *   user: evmAddress('0x9abc…'),
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
export function useClaimRewards(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  ClaimRewardsRequest,
  TransactionReceipt,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ClaimRewardsRequest) =>
      claimRewards(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen(PendingTransaction.tryFrom)
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() =>
          refreshUserClaimableRewards(client, request.user, request.chainId),
        ),
    [client, handler],
  );
}
