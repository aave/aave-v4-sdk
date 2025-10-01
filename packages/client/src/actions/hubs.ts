import type { UnexpectedError } from '@aave/core-next';
import {
  type Hub,
  type HubAsset,
  HubAssetsQuery,
  type HubAssetsRequest,
  HubQuery,
  type HubRequest,
  HubsQuery,
  type HubsRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';
import { type CurrencyQueryOptions, DEFAULT_QUERY_OPTIONS } from '../options';

/**
 * Fetches a specific hub by address and chain ID.
 *
 * ```ts
 * const result = await hub(client, {
 *   hub: evmAddress('0x123…'),
 *   chainId: chainId(1),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub request parameters.
 * @param options - The query options (currency only).
 * @returns The hub data, or null if not found.
 */
export function hub(
  client: AaveClient,
  request: HubRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Hub | null, UnexpectedError> {
  return client.query(HubQuery, { request, ...options });
}

/**
 * Fetches multiple hubs based on specified criteria.
 *
 * ```ts
 * const result = await hubs(client, {
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hubs request parameters (either tokens or chainIds).
 * @param options - The query options (currency only).
 * @returns Array of hub data.
 */
export function hubs(
  client: AaveClient,
  request: HubsRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<Hub[], UnexpectedError> {
  return client.query(HubsQuery, { request, ...options });
}

/**
 * Fetches hub assets for a specific chain and optional hub/user filtering.
 *
 * ```ts
 * const result = await hubAssets(client, {
 *   chainId: chainId(1),
 *   hub: evmAddress('0x123…'),
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
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<HubAsset[], UnexpectedError> {
  return client.query(HubAssetsQuery, { request, ...options });
}
