import type { UnexpectedError } from '@aave/core-next';
import {
  type Hub,
  HubQuery,
  type HubRequest,
  HubsQuery,
  type HubsRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';

import type { AaveClient } from '../AaveClient';

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
 * @returns The hub data, or null if not found.
 */
export function hub(
  client: AaveClient,
  request: HubRequest,
): ResultAsync<Hub | null, UnexpectedError> {
  return client.query(HubQuery, { request });
}

/**
 * Fetches multiple hubs based on specified criteria.
 *
 * ```ts
 * const result = await hubs(client, {
 *   chainIds: [chainId(1), chainId(137)]
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hubs request parameters (either tokens or chainIds).
 * @returns Array of hub data.
 */
export function hubs(
  client: AaveClient,
  request: HubsRequest,
): ResultAsync<Hub[], UnexpectedError> {
  return client.query(HubsQuery, { request });
}
