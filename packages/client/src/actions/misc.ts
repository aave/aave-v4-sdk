import type { UnexpectedError } from '@aave/core-next';
import {
  type Chain,
  ChainsFilter,
  ChainsQuery,
  HasProcessedKnownTransactionQuery,
  type HasProcessedKnownTransactionRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';

/**
 * Fetch supported blockchain chains.
 *
 * @param client - Aave client.
 * @param filter - The chains filter options.
 * @returns Array of supported chains.
 */
export function chains(
  client: AaveClient,
  filter: ChainsFilter = ChainsFilter.ALL,
): ResultAsync<Chain[], UnexpectedError> {
  return client.query(ChainsQuery, { filter });
}

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
