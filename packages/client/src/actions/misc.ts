import type { UnexpectedError } from '@aave/core-next';
import {
  HasProcessedKnownTransactionQuery,
  type HasProcessedKnownTransactionRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';

/**
 * Checks if the API has processed a known transaction hash.
 *
 * This is useful to know when cached data has been invalidated after
 * a transaction is complete, as the API uses caching and has an
 * invalidation task that may take 100-200ms longer.
 *
 * ```ts
 * const result = await borrow(client, request)
 *   .andThen(sendWith(wallet))
 *   .andThen(client.waitForTransaction);
 *
 * if (result.isErr()) {
 *   // Handle error
 *   return;
 * }
 *
 * // Check if the transaction has been processed by the API
 * const processed = await hasProcessedKnownTransaction(client, {
 *   txHash: result.value,
 *   operations: [OperationType.Borrow]
 * });
 *
 * if (processed.isErr()) {
 *   // Handle error
 *   return;
 * }
 *
 * if (processed.value) {
 *   // Transaction processed, cached data is up to date
 *   console.log('Transaction processed, data is fresh');
 * } else {
 *   // Transaction not yet processed, may need to wait
 *   console.log('Transaction not yet processed');
 * }
 * ```
 *
 * @param client - Aave client.
 * @param request - The request containing transaction hash and operations to check.
 * @returns True if the transaction has been processed, false otherwise.
 */
export function hasProcessedKnownTransaction(
  client: AaveClient,
  request: HasProcessedKnownTransactionRequest,
): ResultAsync<boolean, UnexpectedError> {
  return client.query(HasProcessedKnownTransactionQuery, { request });
}
