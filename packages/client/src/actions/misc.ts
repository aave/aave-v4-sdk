import type { UnexpectedError } from '@aave/core-next';
import {
  HasProcessedKnownTransactionQuery,
  type HasProcessedKnownTransactionRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';

/**
 * Check if a transaction has been processed by the Aave API.
 *
 * @param client - Aave client.
 * @param request - The transaction request to check.
 * @returns Whether the transaction has been processed.
 */
export function hasProcessedKnownTransaction(
  client: AaveClient,
  request: HasProcessedKnownTransactionRequest,
): ResultAsync<boolean, UnexpectedError> {
  return client.query(HasProcessedKnownTransactionQuery, { request });
}
