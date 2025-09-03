import type { UnexpectedError } from '@aave/core';
import {
  BestBorrowReserveQuery,
  type BestBorrowReserveRequest,
  type Reserve,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';

/**
 * Fetches the best borrow reserve based on specified criteria.
 *
 * ```ts
 * const result = await bestBorrowReserve(client, {
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   filter: BestBorrowReserveFilter.LowestRate
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The best borrow reserve request parameters.
 * @returns The best reserve for borrowing.
 */
export function bestBorrowReserve(
  client: AaveClient,
  request: BestBorrowReserveRequest,
): ResultAsync<Reserve, UnexpectedError> {
  return client.query(BestBorrowReserveQuery, { request });
}
