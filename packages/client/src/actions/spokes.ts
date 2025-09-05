import type { UnexpectedError } from '@aave/core-next';
import {
  type Spoke,
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
