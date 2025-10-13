import type { UnexpectedError } from '@aave/core-next';
import {
  type PaginatedUserHistoryResult,
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
import type { Prettify, ResultAsync } from '@aave/types-next';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
  type TimeWindowQueryOptions,
} from '../options';

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
 * @param options - The query options.
 * @returns The user's supply positions.
 */
export function userSupplies(
  client: AaveClient,
  request: UserSuppliesRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserSupplyItem[], UnexpectedError> {
  return client.query(UserSuppliesQuery, { request, ...options });
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
 * @param options - The query options.
 * @returns The user's borrow positions.
 */
export function userBorrows(
  client: AaveClient,
  request: UserBorrowsRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserBorrowItem[], UnexpectedError> {
  return client.query(UserBorrowsQuery, { request, ...options });
}

export type UserSummaryQueryOptions = Prettify<
  CurrencyQueryOptions & TimeWindowQueryOptions
>;

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
 * @param options - The query options.
 * @returns The user's financial summary.
 */
export function userSummary(
  client: AaveClient,
  request: UserSummaryRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  }: UserSummaryQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserSummary, UnexpectedError> {
  return client.query(UserSummaryQuery, {
    request,
    currency,
    timeWindow,
  });
}

export type UserPositionQueryOptions = CurrencyQueryOptions &
  TimeWindowQueryOptions;

/**
 * Fetches all user positions across specified chains.
 *
 * ```ts
 * const result = await userPositions(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     chainIds: [chainId(1), chainId(137)],
 *   },
 *   orderBy: { balance: 'DESC' },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user positions request parameters.
 * @param options - The query options.
 * @returns The user's positions across all specified chains.
 */
export function userPositions(
  client: AaveClient,
  request: UserPositionsRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  }: UserPositionQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserPosition[], UnexpectedError> {
  return client.query(UserPositionsQuery, { request, currency, timeWindow });
}

/**
 * Fetches a specific user position by ID.
 *
 * ```ts
 * const result = await userPosition(client, {
 *   id: userPositionId('dGVzdEJhc2U2NA=='),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user position request parameters.
 * @param options - The query options.
 * @returns The specific user position or null if not found.
 */
export function userPosition(
  client: AaveClient,
  request: UserPositionRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  }: UserPositionQueryOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserPosition | null, UnexpectedError> {
  return client.query(UserPositionQuery, { request, currency, timeWindow });
}

/**
 * Fetches all user balances across specified chains.
 *
 * ```ts
 * const result = await userBalances(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     chainIds: [chainId(1), chainId(137)],
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user balances request parameters.
 * @param options - The query options.
 * @returns The user's balances across all specified chains.
 **/
export function userBalances(
  client: AaveClient,
  request: UserBalancesRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserBalance[], UnexpectedError> {
  return client.query(UserBalancesQuery, { request, ...options });
}

/**
 * Fetches user transaction history with pagination.
 *
 * ```ts
 * const result = await userHistory(client, {
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     chainIds: [chainId(1)],
 *   },
 *   activityTypes: ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'],
 *   pageSize: 'FIFTY',
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The user history request parameters.
 * @param options - The query options.
 * @returns The paginated user transaction history.
 */
export function userHistory(
  client: AaveClient,
  request: UserHistoryRequest,
  options: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedUserHistoryResult, UnexpectedError> {
  return client.query(
    UserHistoryQuery,
    { request, currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency },
    options.requestPolicy ?? DEFAULT_QUERY_OPTIONS.requestPolicy,
  );
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
 * @param options - The query options.
 * @returns The user summary history items.
 */
export function userSummaryHistory(
  client: AaveClient,
  request: UserSummaryHistoryRequest,
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): ResultAsync<UserSummaryHistoryItem[], UnexpectedError> {
  return client.query(UserSummaryHistoryQuery, { request, ...options });
}
