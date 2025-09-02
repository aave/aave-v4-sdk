import type { UnexpectedError } from '@aave/core';
import {
  HasProcessedKnownTransactionQuery,
  type HasProcessedKnownTransactionRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
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
