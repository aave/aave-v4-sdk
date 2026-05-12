import type { UnexpectedError } from '@aave/core';
import {
  type PaginatedSpokePositionManagerResult,
  type PaginatedSpokeUserPositionManagerResult,
  type Spoke,
  SpokePositionManagersQuery,
  type SpokePositionManagersRequest,
  SpokeQuery,
  type SpokeRequest,
  SpokeSummaryHistoryQuery,
  type SpokeSummaryHistoryRequest,
  type SpokeSummarySample,
  SpokesQuery,
  type SpokesRequest,
  SpokeUserPositionManagersQuery,
  type SpokeUserPositionManagersRequest,
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
 * Fetches a specific spoke.
 *
 * ```ts
 * const result = await spoke(client, {
 *   query: { spokeId: spokeId('SGVsbG8h') }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spoke request parameters.
 * @param options - The query options.
 * @returns The spoke data, or null if not found.
 */
export function spoke(
  client: AaveClient,
  request: SpokeRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Spoke | null, UnexpectedError> {
  return client.query(
    SpokeQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}

/**
 * Fetches spokes based on specified criteria.
 *
 * ```ts
 * const result = await spokes(client, {
 *   query: { chainIds: [chainId(1)] }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spokes request parameters.
 * @param options - The query options.
 * @returns Array of spokes matching the criteria.
 */
export function spokes(
  client: AaveClient,
  request: SpokesRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Spoke[], UnexpectedError> {
  return client.query(
    SpokesQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}

/**
 * Fetches all positions manager for a specific spoke.
 *
 * ```ts
 * const result = await spokePositionManagers(client, {
 *   spoke: spokeId('SGVsbG8h'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spokes request parameters.
 * @returns Array of spokes matching the criteria.
 */
export function spokePositionManagers(
  client: AaveClient,
  request: SpokePositionManagersRequest,
): ResultAsync<PaginatedSpokePositionManagerResult, UnexpectedError> {
  return client.query(SpokePositionManagersQuery, { request });
}

/**
 * Fetches all the positions managers of a user for a specific spoke.
 *
 * ```ts
 * const result = await spokeUserPositionManagers(client, {
 *   spoke: spokeId('SGVsbG8h'),
 *   user: evmAddress('0x123...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spokes and pagination request parameters.
 * @returns Array of position managers of a user for a specific spoke.
 */
export function spokeUserPositionManagers(
  client: AaveClient,
  request: SpokeUserPositionManagersRequest,
): ResultAsync<PaginatedSpokeUserPositionManagerResult, UnexpectedError> {
  return client.query(SpokeUserPositionManagersQuery, { request });
}

/**
 * Fetches historical summary data for a specific spoke.
 *
 * ```ts
 * const result = await spokeSummaryHistory(client, {
 *   query: { spokeId: spokeId('SGVsbG8h') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spoke summary history request parameters.
 * @param options - The query options.
 * @returns Array of spoke summary samples over time.
 */
export function spokeSummaryHistory(
  client: AaveClient,
  request: SpokeSummaryHistoryRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<SpokeSummarySample[], UnexpectedError> {
  return client.query(SpokeSummaryHistoryQuery, { request }, { requestPolicy });
}
