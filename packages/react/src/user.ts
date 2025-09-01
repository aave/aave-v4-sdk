import {
  type UserBorrowItem,
  UserBorrowsQuery,
  type UserBorrowsRequest,
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
