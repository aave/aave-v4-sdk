import type { TransactionReceipt } from '@aave/client';
import { setUserSuppliesAsCollateral } from '@aave/client/actions';
import {
  decodeReserveId,
  type SetUserSuppliesAsCollateralRequest,
  type TransactionRequest,
} from '@aave/graphql';
import { ResultAsync } from '@aave/types';

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

import {
  refreshHubs,
  refreshReserves,
  refreshSpokes,
  refreshUserBorrows,
  refreshUserPositions,
  refreshUserSummary,
  refreshUserSupplies,
} from './cache';

/**
 * Hook for updating the collateral status of user's supplies.
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [setUserSuppliesAsCollateral, { loading, error }] = useSetUserSuppliesAsCollateral((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * const result = await setUserSuppliesAsCollateral({
 *   changes: [
 *     {
 *       reserve: reserve.id,
 *       enableCollateral: true
 *     }
 *   ],
 *   sender: evmAddress('0x456...')
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
export function useSetUserSuppliesAsCollateral(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  SetUserSuppliesAsCollateralRequest,
  TransactionReceipt,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SetUserSuppliesAsCollateralRequest) => {
      const reserveIds = request.changes.map((change) => change.reserve);
      const reserveDetails = reserveIds.map((reserveId) =>
        decodeReserveId(reserveId),
      );
      return setUserSuppliesAsCollateral(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() =>
          ResultAsync.combine([
            // update user supplies
            refreshUserSupplies(client, request.sender),

            // update user borrows
            refreshUserBorrows(client, request.sender),

            ...reserveDetails.flatMap(({ chainId, spoke }) => [
              // update user positions
              refreshUserPositions(client, request.sender, {
                chainId,
                address: spoke,
              }),

              // update user summary
              refreshUserSummary(client, request.sender, {
                chainId,
                address: spoke,
              }),

              // update spokes
              refreshSpokes(client, { chainId, address: spoke }),
            ]),

            // update reserves
            refreshReserves(client, reserveIds),

            // update hubs
            ...reserveDetails.map(({ chainId }) =>
              refreshHubs(client, chainId),
            ),
          ]),
        );
    },
    [client, handler],
  );
}
