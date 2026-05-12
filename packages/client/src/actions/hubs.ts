import type { UnexpectedError } from '@aave/core';
import {
  type Hub,
  type HubAsset,
  type HubAssetInterestRateModelPoint,
  HubAssetInterestRateModelQuery,
  type HubAssetInterestRateModelRequest,
  HubAssetsQuery,
  type HubAssetsRequest,
  HubQuery,
  type HubRequest,
  type HubSpokeConfig,
  HubSpokeConfigsQuery,
  type HubSpokeConfigsRequest,
  HubSummaryHistoryQuery,
  type HubSummaryHistoryRequest,
  type HubSummarySample,
  HubsQuery,
  type HubsRequest,
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
 * Fetches a specific hub by ID or by address and chain ID.
 *
 * ```ts
 * const result = await hub(client, {
 *   query: { hubId: hubId('SGVsbG8h') }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub request parameters.
 * @param options - The query options.
 * @returns The hub data, or null if not found.
 */
export function hub(
  client: AaveClient,
  request: HubRequest,
  options: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Hub | null, UnexpectedError> {
  return client.query(
    HubQuery,
    {
      request,
      currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
      timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
    },
    {
      requestPolicy:
        options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
    },
  );
}

/**
 * Fetches multiple hubs based on specified criteria.
 *
 * ```ts
 * const result = await hubs(client, {
 *   query: {
 *     chainIds: [chainId(1)]
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hubs request parameters (either tokens or chainIds).
 * @param options - The query options.
 * @returns Array of hub data.
 */
export function hubs(
  client: AaveClient,
  request: HubsRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Hub[], UnexpectedError> {
  return client.query(
    HubsQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}

/**
 * Fetches hub assets for a specific hub by ID or by address and chain ID.
 *
 * ```ts
 * const result = await hubAssets(client, {
 *   query: { hubId: hubId('SGVsbG8h') },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub assets request parameters.
 * @param options - The query options.
 * @returns The hub assets array.
 */
export function hubAssets(
  client: AaveClient,
  request: HubAssetsRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<HubAsset[], UnexpectedError> {
  return client.query(
    HubAssetsQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}

/**
 * Fetches historical summary data for a specific hub.
 *
 * ```ts
 * const result = await hubSummaryHistory(client, {
 *   query: { hubId: hubId('SGVsbG8h') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub summary history request parameters.
 * @param options - The query options.
 * @returns Array of hub summary samples over time.
 */
export function hubSummaryHistory(
  client: AaveClient,
  request: HubSummaryHistoryRequest,
  {
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<HubSummarySample[], UnexpectedError> {
  return client.query(HubSummaryHistoryQuery, { request }, { requestPolicy });
}

/**
 * Fetches the interest rate model for a specific hub asset.
 *
 * ```ts
 * const result = await hubAssetInterestRateModel(client, {
 *   query: { hubAssetId: hubAssetId('...') },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub asset interest rate model request parameters.
 * @param options - The query options.
 * @returns Array of interest rate model points.
 */
export function hubAssetInterestRateModel(
  client: AaveClient,
  request: HubAssetInterestRateModelRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<HubAssetInterestRateModelPoint[], UnexpectedError> {
  return client
    .query(
      HubAssetInterestRateModelQuery,
      { request, currency },
      { requestPolicy },
    )
    .map((result) => result.points);
}

/**
 * Fetches per-asset configuration for a (hub, spoke) pair.
 *
 * ```ts
 * const result = await hubSpokeConfigs(client, {
 *   hubId: hubId('SGVsbG8h'),
 *   spokeId: spokeId('SGVsbG8h'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub spoke configs request parameters.
 * @param options - The query options.
 * @returns Array of per-asset hub spoke configurations.
 */
export function hubSpokeConfigs(
  client: AaveClient,
  request: HubSpokeConfigsRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<HubSpokeConfig[], UnexpectedError> {
  return client.query(
    HubSpokeConfigsQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}
