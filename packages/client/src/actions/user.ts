import {
  type UserBorrowItem,
  UserBorrowsQuery,
  type UserBorrowsRequest,
  UserSuppliesQuery,
  type UserSuppliesRequest,
  type UserSupplyItem,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../client';
import type { UnexpectedError } from '../errors';

/**
 * Fetches all user supply positions across the specified spoke.
 *
 * ```ts
 * const result = await userSupplies(client, {
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user supplies request parameters.
 * @returns The user's supply positions.
 */
export function userSupplies(
  client: AaveClient,
  request: UserSuppliesRequest,
): ResultAsync<UserSupplyItem[], UnexpectedError> {
  return client.query(UserSuppliesQuery, { request });
}

/**
 * Fetches all user borrow positions across the specified spoke.
 *
 * ```ts
 * const result = await userBorrows(client, {
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user borrows request parameters.
 * @returns The user's borrow positions.
 */
export function userBorrows(
  client: AaveClient,
  request: UserBorrowsRequest,
): ResultAsync<UserBorrowItem[], UnexpectedError> {
  return client.query(UserBorrowsQuery, { request });
}
