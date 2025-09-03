import type { UnexpectedError } from '@aave/core';
import {
  BestBorrowReserveQuery,
  type BestBorrowReserveRequest,
  BestSupplyReserveQuery,
  type BestSupplyReserveRequest,
  type Reserve,
  ReservesQuery,
  type ReservesRequest,
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

/**
 * Fetches the best supply reserve based on specified criteria.
 *
 * ```ts
 * const result = await bestSupplyReserve(client, {
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   filter: BestSupplyReserveFilter.HighestYield
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The best supply reserve request parameters.
 * @returns The best reserve for supplying.
 */
export function bestSupplyReserve(
  client: AaveClient,
  request: BestSupplyReserveRequest,
): ResultAsync<Reserve, UnexpectedError> {
  return client.query(BestSupplyReserveQuery, { request });
}

/**
 * Fetches reserves based on specified criteria.
 *
 * ```ts
 * const result = await reserves(client, {
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   filter: ReservesFilterRequest.All,
 *   orderBy: { name: 'ASC' }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The reserves request parameters.
 * @returns Array of reserves matching the criteria.
 */
export function reserves(
  client: AaveClient,
  request: ReservesRequest,
): ResultAsync<Reserve[], UnexpectedError> {
  return client.query(ReservesQuery, { request });
}
