import type { UnexpectedError } from '@aave/core-next';
import {
  type PaginatedSpokePositionManagerResult,
  type PaginatedSpokeUserPositionManagerResult,
  type Spoke,
  SpokePositionManagersQuery,
  type SpokePositionManagersRequest,
  SpokeQuery,
  type SpokeRequest,
  SpokesQuery,
  type SpokesRequest,
  SpokeUserPositionManagersQuery,
  type SpokeUserPositionManagersRequest,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';

/**
 * Fetches a specific spoke by address and chain ID.
 *
 * ```ts
 * const result = await spoke(client, {
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The spoke request parameters.
 * @returns The spoke data, or null if not found.
 */
export function spoke(
  client: AaveClient,
  request: SpokeRequest,
): ResultAsync<Spoke | null, UnexpectedError> {
  return client.query(SpokeQuery, { request });
}

/**
 * Fetches spokes based on specified criteria.
 *
 * ```ts
 * const result = await spokes(client, {
 *     chainIds: [chainId(1)]
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

/**
 * Fetches all the positions managers of a user for a specific spoke.
 *
 * ```ts
 * const result = await spokeUserPositionManagers(client, {
 *   spoke: {
 *     chainId: chainId(1),
 *     address: evmAddress('0x878...'),
 *   },
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
