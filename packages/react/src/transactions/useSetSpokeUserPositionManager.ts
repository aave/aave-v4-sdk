import type { TransactionReceipt } from '@aave/client';
import { setSpokeUserPositionManager } from '@aave/client/actions';
import type {
  SetSpokeUserPositionManagerRequest,
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
 * A hook that provides a way to set or remove a position manager for a user on a specific spoke.
 *
 * **Position managers** can perform transactions on behalf of other users, including:
 * - Supply assets
 * - Borrow assets
 * - Withdraw assets
 * - Enable/disable collateral
 *
 * The `signature` parameter is an **ERC712 signature** that must be signed by the **user**
 * (the account granting permissions) to authorize the position manager. The signature contains:
 * - `value`: The actual cryptographic signature
 * - `deadline`: Unix timestamp when the authorization expires
 *
 * ```ts
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [setSpokeUserPositionManager, { loading, error }] = useSetSpokeUserPositionManager((transaction, { cancel }) => {
 *   return sendTransaction(transaction);
 * });
 *
 * const result = await setSpokeUserPositionManager({
 *   spoke: spokeId('SGVsbG8h'),
 *   manager: evmAddress('0x9abc…'), // Address that will become the position manager
 *   approve: true, // true to approve, false to remove the manager
 *   user: evmAddress('0xdef0…'), // User granting the permission (must sign the signature)
 *   signature: {
 *     value: '0x1234...', // ERC712 signature signed by the user
 *     deadline: 1735689600, // Unix timestamp when signature expires
 *   },
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
export function useSetSpokeUserPositionManager(
  handler: ExecutionPlanHandler<TransactionRequest, PendingTransaction>,
): UseAsyncTask<
  SetSpokeUserPositionManagerRequest,
  TransactionReceipt,
  SendTransactionError | PendingTransactionError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: SetSpokeUserPositionManagerRequest) =>
      setSpokeUserPositionManager(client, request)
        .andThen((transaction) => handler(transaction, { cancel }))
        .andThen((pending) => pending.wait())
        .andThen(client.waitForTransaction)
        .andThrough(() => refreshSpokePositionManagers(client, request.spoke)),
    [client, handler],
  );
}
