import type { UnexpectedError } from '@aave/core-next';
import {
  type APYSample,
  type BorrowAPYHistoryRequest,
  BorrowApyHistoryQuery,
  type HubAsset,
  HubAssetsQuery,
  type HubAssetsRequest,
  type PaginatedUserHistoryResult,
  SetUserSupplyAsCollateralQuery,
  type SetUserSupplyAsCollateralRequest,
  type SupplyAPYHistoryRequest,
  SupplyApyHistoryQuery,
  type TransactionRequest,
  type UserBalance,
  UserBalancesQuery,
  type UserBalancesRequest,
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
  type UserSummaryHistoryItem,
  UserSummaryHistoryQuery,
  type UserSummaryHistoryRequest,
  UserSummaryQuery,
  type UserSummaryRequest,
  UserSuppliesQuery,
  type UserSuppliesRequest,
  type UserSupplyItem,
} from '@aave/graphql-next';
import type { ResultAsync } from '@aave/types-next';

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
 *   id: userPositionId('dGVzdEJhc2U2NA=='),
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user position request parameters.
 * @returns The specific user position or null if not found.
 */
export function userPosition(
  client: AaveClient,
  request: UserPositionRequest,
): ResultAsync<UserPosition | null, UnexpectedError> {
  return client.query(UserPositionQuery, { request });
}

/**
 * Fetches all user balances across specified chains.
 *
 * ```ts
 * const result = await userBalances(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user balances request parameters.
 * @returns The user's balances across all specified chains.
 **/
export function userBalances(
  client: AaveClient,
  request: UserBalancesRequest,
): ResultAsync<UserBalance[], UnexpectedError> {
  return client.query(UserBalancesQuery, { request });
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

/**
 * Fetches user summary history over time.
 *
 * ```ts
 * const result = await userSummaryHistory(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   window: TimeWindow.LastWeek,
 *   filter: {
 *     chainIds: [chainId(1)]
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user summary history request parameters.
 * @returns The user summary history items.
 */
export function userSummaryHistory(
  client: AaveClient,
  request: UserSummaryHistoryRequest,
): ResultAsync<UserSummaryHistoryItem[], UnexpectedError> {
  return client.query(UserSummaryHistoryQuery, { request });
}

/**
 * Fetches borrow APY history for a specific reserve over time.
 *
 * ```ts
 * const result = await borrowApyHistory(client, {
 *   spoke: {
 *     address: evmAddress('0x123...'),
 *     chainId: chainId(1)
 *   },
 *   reserve: reserveId(1),
 *   window: TimeWindow.LastWeek
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The borrow APY history request parameters.
 * @returns The borrow APY history samples.
 */
export function borrowApyHistory(
  client: AaveClient,
  request: BorrowAPYHistoryRequest,
): ResultAsync<APYSample[], UnexpectedError> {
  return client.query(BorrowApyHistoryQuery, { request });
}

/**
 * Fetches supply APY history for a specific reserve over time.
 *
 * ```ts
 * const result = await supplyApyHistory(client, {
 *   spoke: {
 *     address: evmAddress('0x123...'),
 *     chainId: chainId(1)
 *   },
 *   reserve: reserveId(1),
 *   window: TimeWindow.LastWeek
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The supply APY history request parameters.
 * @returns The supply APY history samples.
 */
export function supplyApyHistory(
  client: AaveClient,
  request: SupplyAPYHistoryRequest,
): ResultAsync<APYSample[], UnexpectedError> {
  return client.query(SupplyApyHistoryQuery, { request });
}

/**
 * Fetches hub assets for a specific chain and optional hub/user filtering.
 *
 * ```ts
 * const result = await hubAssets(client, {
 *   chainId: chainId(1),
 *   hub: evmAddress('0x123...'), // optional
 *   user: evmAddress('0x456...'), // optional
 *   include: [HubAssetStatusType.Active, HubAssetStatusType.Frozen], // optional, defaults to all
 *   orderBy: HubAssetsRequestOrderBy.Name // optional, defaults to NAME
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The hub assets request parameters.
 * @returns The hub assets array.
 */
export function hubAssets(
  client: AaveClient,
  request: HubAssetsRequest,
): ResultAsync<HubAsset[], UnexpectedError> {
  return client.query(HubAssetsQuery, { request });
}

/**
 * Sets whether a user's supply should be used as collateral.
 *
 * ```ts
 * const result = await setUserSupplyAsCollateral(client, {
 *   reserve: {
 *     chainId: chainId(1),
 *     spoke: evmAddress('0x123...'),
 *     reserveId: reserveId(1)
 *   },
 *   sender: evmAddress('0x456...'),
 *   enableCollateral: true
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The set user supply as collateral request parameters.
 * @returns The transaction request to set collateral status.
 */
export function setUserSupplyAsCollateral(
  client: AaveClient,
  request: SetUserSupplyAsCollateralRequest,
): ResultAsync<TransactionRequest, UnexpectedError> {
  return client.query(SetUserSupplyAsCollateralQuery, { request });
}
