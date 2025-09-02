import {
  type UserBalance,
  UserBalancesQuery,
  type UserBalancesRequest,
  type UserBorrowItem,
  UserBorrowsQuery,
  type UserBorrowsRequest,
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
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseUserSuppliesArgs = UserSuppliesRequest;

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
  ...request
}: UseUserSuppliesArgs & {
  suspense?: boolean;
}): SuspendableResult<UserSupplyItem[]> {
  return useSuspendableQuery({
    document: UserSuppliesQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseUserBorrowsArgs = UserBorrowsRequest;

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
  ...request
}: UseUserBorrowsArgs & {
  suspense?: boolean;
}): SuspendableResult<UserBorrowItem[]> {
  return useSuspendableQuery({
    document: UserBorrowsQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseUserSummaryArgs = UserSummaryRequest;

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
  ...request
}: UseUserSummaryArgs & {
  suspense?: boolean;
}): SuspendableResult<UserSummary> {
  return useSuspendableQuery({
    document: UserSummaryQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseUserPositionsArgs = UserPositionsRequest;

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
  ...request
}: UseUserPositionsArgs & {
  suspense?: boolean;
}): SuspendableResult<UserPosition[]> {
  return useSuspendableQuery({
    document: UserPositionsQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseUserPositionArgs = UserPositionRequest;

/**
 * Fetch a specific user position by ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserPosition({
 *   id: userPositionId('0x1234…'),
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
 *   id: userPositionId('0x1234…'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 */
export function useUserPosition(
  args: UseUserPositionArgs,
): ReadResult<UserPosition>;

export function useUserPosition({
  suspense = false,
  ...request
}: UseUserPositionArgs & {
  suspense?: boolean;
}): SuspendableResult<UserPosition> {
  return useSuspendableQuery({
    document: UserPositionQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseUserBalancesArgs = UserBalancesRequest;

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
  ...request
}: UseUserBalancesArgs & {
  suspense?: boolean;
}): SuspendableResult<UserBalance[]> {
  return useSuspendableQuery({
    document: UserBalancesQuery,
    variables: {
      request,
    },
    suspense,
  });
}
