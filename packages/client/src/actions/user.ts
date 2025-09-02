import type { UnexpectedError } from '@aave/core';
import {
  type PaginatedUserHistoryResult,
  type UserBorrowItem,
  UserBorrowsQuery,
  type UserBorrowsRequest,
  UserHistoryQuery,
  type UserHistoryRequest,
  type UserPosition,
  UserPositionQuery,
  type UserPositionRequest,
  UserPositionsQuery,
  type UserPositionsRequest,
  type UserSummary,
  UserSummaryQuery,
  type UserSummaryRequest,
  UserSuppliesQuery,
  type UserSuppliesRequest,
  type UserSupplyItem,
} from '@aave/graphql';
import type { ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';

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

/**
 * Fetches a user's summary across all positions.
 *
 * ```ts
 * const result = await userSummary(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user summary request parameters.
 * @returns The user's financial summary.
 */
export function userSummary(
  client: AaveClient,
  request: UserSummaryRequest,
): ResultAsync<UserSummary, UnexpectedError> {
  return client.query(UserSummaryQuery, { request });
}

/**
 * Fetches all user positions across specified chains.
 *
 * ```ts
 * const result = await userPositions(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   orderBy: { balance: 'DESC' },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user positions request parameters.
 * @returns The user's positions across all specified chains.
 */
export function userPositions(
  client: AaveClient,
  request: UserPositionsRequest,
): ResultAsync<UserPosition[], UnexpectedError> {
  return client.query(UserPositionsQuery, { request });
}

/**
 * Fetches a specific user position by ID.
 *
 * ```ts
 * const result = await userPosition(client, {
 *   id: userPositionId('0x1234…'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user position request parameters.
 * @returns The specific user position.
 */
export function userPosition(
  client: AaveClient,
  request: UserPositionRequest,
): ResultAsync<UserPosition, UnexpectedError> {
  return client.query(UserPositionQuery, { request });
}

/**
 * Fetches user transaction history with pagination.
 *
 * ```ts
 * const result = await userHistory(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   chainId: chainId(1),
 *   activityTypes: ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'],
 *   pageSize: 'FIFTY',
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user history request parameters.
 * @returns The paginated user transaction history.
 */
export function userHistory(
  client: AaveClient,
  request: UserHistoryRequest,
): ResultAsync<PaginatedUserHistoryResult, UnexpectedError> {
  return client.query(UserHistoryQuery, { request });
}
