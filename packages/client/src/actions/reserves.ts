import type { UnexpectedError } from '@aave/core';
import {
  type APYSample,
  type BorrowAPYHistoryRequest,
  BorrowApyHistoryQuery,
  type Reserve,
  ReserveQuery,
  type ReserveRequest,
  ReservesQuery,
  type ReservesRequest,
  type SupplyAPYHistoryRequest,
  SupplyApyHistoryQuery,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import { type CurrencyQueryOptions, DEFAULT_QUERY_OPTIONS } from '../options';

/**
 * Fetches a specific reserve by reserve ID, spoke, and chain.
 *
 * ```ts
 * const result = await reserve(client, {
 *   reserve: reserveId('SGVsbG8h'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The reserve request parameters.
 * @param options - The query options.
 * @returns The reserve data, or null if not found.
 */
export function reserve(
  client: AaveClient,
  request: ReserveRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Reserve | null, UnexpectedError> {
  return client.query(ReserveQuery, { request, ...options });
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
 *   filter: ReservesRequestFilter.All,
 *   orderBy: { name: 'ASC' }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The reserves request parameters.
 * @param options - The query options.
 * @returns Array of reserves matching the criteria.
 */
export function reserves(
  client: AaveClient,
  request: ReservesRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Reserve[], UnexpectedError> {
  return client.query(ReservesQuery, { request, ...options });
}

/**
 * Fetches borrow APY history for a specific reserve over time.
 *
 * ```ts
 * const result = await borrowApyHistory(client, {
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The borrow APY history request parameters.
 * @returns The borrow APY history samples.
 */
export function borrowApyHistory(
  client: AaveClient,
  request: BorrowAPYHistoryRequest,
): ResultAsync<APYSample[], UnexpectedError> {
  return client.query(BorrowApyHistoryQuery, { request });
}

/**
 * Fetches supply APY history for a specific reserve over time.
 *
 * ```ts
 * const result = await supplyApyHistory(client, {
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The supply APY history request parameters.
 * @returns The supply APY history samples.
 */
export function supplyApyHistory(
  client: AaveClient,
  request: SupplyAPYHistoryRequest,
): ResultAsync<APYSample[], UnexpectedError> {
  return client.query(SupplyApyHistoryQuery, { request });
}
