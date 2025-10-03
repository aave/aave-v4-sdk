import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '@aave/client-next';
import type { UserPositionQueryOptions } from '@aave/client-next/actions';
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
import type { Prettify } from '@aave/types-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseUserSuppliesArgs = Prettify<
  UserSuppliesRequest & CurrencyQueryOptions
>;

/**
 * Fetch all user supply positions.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserSupplies({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 *   suspense: true,
 * });
 * ```
 */
export function useUserSupplies(
  args: UseUserSuppliesArgs & Suspendable,
): SuspenseResult<UserSupplyItem[]>;

/**
 * Fetch all user supply positions.
 *
 * ```tsx
 * const { data, error, loading } = useUserSupplies({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 * });
 * ```
 */
export function useUserSupplies(
  args: UseUserSuppliesArgs,
): ReadResult<UserSupplyItem[]>;

export function useUserSupplies({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseUserSuppliesArgs & {
  suspense?: boolean;
}): SuspendableResult<UserSupplyItem[]> {
  return useSuspendableQuery({
    document: UserSuppliesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

export type UseUserBorrowsArgs = Prettify<
  UserBorrowsRequest & CurrencyQueryOptions
>;

/**
 * Fetch all user borrow positions.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserBorrows({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 *   suspense: true,
 * });
 * ```
 */
export function useUserBorrows(
  args: UseUserBorrowsArgs & Suspendable,
): SuspenseResult<UserBorrowItem[]>;

/**
 * Fetch all user borrow positions.
 *
 * ```tsx
 * const { data, error, loading } = useUserBorrows({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 * });
 * ```
 */
export function useUserBorrows(
  args: UseUserBorrowsArgs,
): ReadResult<UserBorrowItem[]>;

export function useUserBorrows({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseUserBorrowsArgs & {
  suspense?: boolean;
}): SuspendableResult<UserBorrowItem[]> {
  return useSuspendableQuery({
    document: UserBorrowsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

export type UseUserSummaryArgs = Prettify<
  UserSummaryRequest & TimeWindowQueryOptions & CurrencyQueryOptions
>;

/**
 * Fetch a user's financial summary.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserSummary({
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *   },
 *   suspense: true,
 * });
 * ```
 */
export function useUserSummary(
  args: UseUserSummaryArgs & Suspendable,
): SuspenseResult<UserSummary>;

/**
 * Fetch a user's financial summary.
 *
 * ```tsx
 * const { data, error, loading } = useUserSummary({
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *   },
 * });
 * ```
 */
export function useUserSummary(
  args: UseUserSummaryArgs,
): ReadResult<UserSummary>;

export function useUserSummary({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: UseUserSummaryArgs & {
  suspense?: boolean;
}): SuspendableResult<UserSummary> {
  return useSuspendableQuery({
    document: UserSummaryQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
  });
}

export type UseUserPositionsArgs = Prettify<
  UserPositionsRequest & UserPositionQueryOptions
>;

/**
 * Fetch all user positions across specified chains.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserPositions({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   orderBy: { balance: 'DESC' },
 *   suspense: true,
 * });
 * ```
 */
export function useUserPositions(
  args: UseUserPositionsArgs & Suspendable,
): SuspenseResult<UserPosition[]>;

/**
 * Fetch all user positions across specified chains.
 *
 * ```tsx
 * const { data, error, loading } = useUserPositions({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   orderBy: { balance: 'DESC' },
 * });
 * ```
 */
export function useUserPositions(
  args: UseUserPositionsArgs,
): ReadResult<UserPosition[]>;

export function useUserPositions({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: UseUserPositionsArgs & {
  suspense?: boolean;
}): SuspendableResult<UserPosition[]> {
  return useSuspendableQuery({
    document: UserPositionsQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
  });
}

export type UseUserPositionArgs = Prettify<
  UserPositionRequest & UserPositionQueryOptions
>;

/**
 * Fetch a specific user position by ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserPosition({
 *   id: userPositionId('dGVzdEJhc2U2NA=='),
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 * });
 * ```
 */
export function useUserPosition(
  args: UseUserPositionArgs & Suspendable,
): SuspenseResult<UserPosition>;

/**
 * Fetch a specific user position by ID.
 *
 * ```tsx
 * const { data, error, loading } = useUserPosition({
 *   id: userPositionId('dGVzdEJhc2U2NA=='),
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 */
export function useUserPosition(
  args: UseUserPositionArgs,
): ReadResult<UserPosition>;

export function useUserPosition({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: UseUserPositionArgs & {
  suspense?: boolean;
}): SuspendableResult<UserPosition | null> {
  return useSuspendableQuery({
    document: UserPositionQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
  });
}

export type UseUserBalancesArgs = Prettify<
  UserBalancesRequest & CurrencyQueryOptions
>;

/**
 * Fetch all user balances across specified chains.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserBalances({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   suspense: true,
 * });
 * ```
 */
export function useUserBalances(
  args: UseUserBalancesArgs & Suspendable,
): SuspenseResult<UserBalance[]>;

/**
 * Fetch all user balances across specified chains.
 *
 * ```tsx
 * const { data, error, loading } = useUserBalances({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 * });
 * ```
 */
export function useUserBalances(
  args: UseUserBalancesArgs,
): ReadResult<UserBalance[]>;

export function useUserBalances({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseUserBalancesArgs & {
  suspense?: boolean;
}): SuspendableResult<UserBalance[]> {
  return useSuspendableQuery({
    document: UserBalancesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

export type UseUserHistoryArgs = Prettify<
  UserHistoryRequest & CurrencyQueryOptions
>;

/**
 * Fetch user transaction history with pagination.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserHistory({
 *   user: evmAddress('0x742d35cc…'),
 *   chainId: chainId(1),
 *   activityTypes: ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'],
 *   pageSize: 'FIFTY',
 *   suspense: true,
 * });
 * ```
 */
export function useUserHistory(
  args: UseUserHistoryArgs & Suspendable,
): SuspenseResult<PaginatedUserHistoryResult>;

/**
 * Fetch user transaction history with pagination.
 *
 * ```tsx
 * const { data, error, loading } = useUserHistory({
 *   user: evmAddress('0x742d35cc…'),
 *   chainId: chainId(1),
 *   activityTypes: ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'],
 *   pageSize: 'FIFTY',
 * });
 * ```
 */
export function useUserHistory(
  args: UseUserHistoryArgs,
): ReadResult<PaginatedUserHistoryResult>;

export function useUserHistory({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseUserHistoryArgs & {
  suspense?: boolean;
}): SuspendableResult<PaginatedUserHistoryResult> {
  return useSuspendableQuery({
    document: UserHistoryQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

export type UseUserSummaryHistoryArgs = Prettify<
  UserSummaryHistoryRequest & CurrencyQueryOptions
>;

/**
 * Fetch user summary history over time.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserSummaryHistory({
 *   user: evmAddress('0x742d35cc…'),
 *   window: TimeWindow.LastWeek,
 *   filter: { chainIds: [chainId(1)] },
 *   suspense: true,
 * });
 * ```
 */
export function useUserSummaryHistory(
  args: UseUserSummaryHistoryArgs & Suspendable,
): SuspenseResult<UserSummaryHistoryItem[]>;

/**
 * Fetch user summary history over time.
 *
 * ```tsx
 * const { data, error, loading } = useUserSummaryHistory({
 *   user: evmAddress('0x742d35cc…'),
 *   window: TimeWindow.LastWeek,
 *   filter: { chainIds: [chainId(1)] },
 * });
 * ```
 */
export function useUserSummaryHistory(
  args: UseUserSummaryHistoryArgs,
): ReadResult<UserSummaryHistoryItem[]>;

export function useUserSummaryHistory({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseUserSummaryHistoryArgs & {
  suspense?: boolean;
}): SuspendableResult<UserSummaryHistoryItem[]> {
  return useSuspendableQuery({
    document: UserSummaryHistoryQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}
