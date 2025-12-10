import type { UnexpectedError } from '@aave/core';
import {
  type Hub,
  type HubAsset,
  HubAssetsQuery,
  type HubAssetsRequest,
  HubQuery,
  type HubRequest,
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
  }: Required<CurrencyQueryOptions> &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Hub[], UnexpectedError> {
  return client.query(HubsQuery, { request, currency, timeWindow });
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
  }: Required<CurrencyQueryOptions> &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<HubAsset[], UnexpectedError> {
  return client.query(HubAssetsQuery, { request, currency, timeWindow });
}
