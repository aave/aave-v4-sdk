import type { UnexpectedError } from '@aave/core-next';
import {
  type PaginatedSpokePositionManagerResult,
  type Spoke,
  SpokePositionManagersQuery,
  type SpokePositionManagersRequest,
  SpokesQuery,
  type SpokesRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';

/**
 * Fetches spokes based on specified criteria.
 *
 * ```ts
 * const result = await spokes(client, {
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spokes request parameters.
 * @returns Array of spokes matching the criteria.
 */
export function spokes(
  client: AaveClient,
  request: SpokesRequest,
): ResultAsync<Spoke[], UnexpectedError> {
  return client.query(SpokesQuery, { request });
}

/**
 * Fetches all positions manager for a specific spoke.
 *
 * ```ts
 * const result = await spokePositionManagers(client, {
 *   spoke: {
 *     chainId: chainId(1),
 *     address: evmAddress('0x878...'),
 *   },
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
