import type { UnexpectedError } from '@aave/core';
import {
  type ApySample,
  BorrowApyHistoryQuery,
  type BorrowApyHistoryRequest,
  type PaginatedReserveHoldersResult,
  type Reserve,
  ReserveHoldersQuery,
  type ReserveHoldersRequest,
  type ReserveIdentity,
  ReserveIdsQuery,
  ReserveQuery,
  type ReserveRequest,
  ReservesQuery,
  type ReservesRequest,
  SupplyApyHistoryQuery,
  type SupplyApyHistoryRequest,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
  type TimeWindowQueryOptions,
} from '../options';

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
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Reserve | null, UnexpectedError> {
  return client.query(
    ReserveQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
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
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Reserve[], UnexpectedError> {
  return client.query(
    ReservesQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}

/**
 * Fetches the id of each reserve matching the criteria, with the chain, spoke,
 * hub and underlying token that name it. No rates, caps or user state.
 *
 * Use it over {@link reserves} to look a reserve up by name or build links to
 * it. On a chain with many reserves the full data runs to megabytes.
 *
 * ```ts
 * const result = await reserveIds(client, {
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The reserves request parameters.
 * @param options - The query options.
 * @returns The id and names of each reserve matching the criteria.
 */
export function reserveIds(
  client: AaveClient,
  request: ReservesRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<ReserveIdentity[], UnexpectedError> {
  return client.query(ReserveIdsQuery, { request }, { requestPolicy });
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
 * @param options - The query options.
 * @returns The borrow APY history samples.
 */
export function borrowApyHistory(
  client: AaveClient,
  request: BorrowApyHistoryRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<ApySample[], UnexpectedError> {
  return client.query(BorrowApyHistoryQuery, { request }, { requestPolicy });
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
 * @param options - The query options.
 * @returns The supply APY history samples.
 */
export function supplyApyHistory(
  client: AaveClient,
  request: SupplyApyHistoryRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<ApySample[], UnexpectedError> {
  return client.query(SupplyApyHistoryQuery, { request }, { requestPolicy });
}

/**
 * Fetches a paginated list of top holders for a specific reserve.
 *
 * ```ts
 * const result = await reserveHolders(client, {
 *   reserve: { reserveId: reserveId('SGVsbG8h') },
 *   filter: ReserveHoldersFilter.Supplied,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The reserve holders request parameters.
 * @param options - The query options.
 * @returns Paginated list of reserve holders.
 */
export function reserveHolders(
  client: AaveClient,
  request: ReserveHoldersRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedReserveHoldersResult, UnexpectedError> {
  return client.query(
    ReserveHoldersQuery,
    { request, currency },
    { requestPolicy },
  );
}
