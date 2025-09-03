import {
  BestBorrowReserveQuery,
  type BestBorrowReserveRequest,
  BestSupplyReserveQuery,
  type BestSupplyReserveRequest,
  type Reserve,
  ReservesQuery,
  type ReservesRequest,
} from '@aave/graphql-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseBestBorrowReserveArgs = BestBorrowReserveRequest;

/**
 * Find the best borrow reserve based on specified criteria.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useBestBorrowReserve({
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   filter: BestBorrowReserveFilter.LowestRate,
 *   suspense: true,
 * });
 * ```
 */
export function useBestBorrowReserve(
  args: UseBestBorrowReserveArgs & Suspendable,
): SuspenseResult<Reserve>;

/**
 * Find the best borrow reserve based on specified criteria.
 *
 * ```tsx
 * const { data, error, loading } = useBestBorrowReserve({
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   filter: BestBorrowReserveFilter.LowestRate,
 * });
 * ```
 */
export function useBestBorrowReserve(
  args: UseBestBorrowReserveArgs,
): ReadResult<Reserve>;

export function useBestBorrowReserve({
  suspense = false,
  ...request
}: UseBestBorrowReserveArgs & {
  suspense?: boolean;
}): SuspendableResult<Reserve> {
  return useSuspendableQuery({
    document: BestBorrowReserveQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseBestSupplyReserveArgs = BestSupplyReserveRequest;

/**
 * Find the best supply reserve based on specified criteria.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useBestSupplyReserve({
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   filter: BestSupplyReserveFilter.HighestYield,
 *   suspense: true,
 * });
 * ```
 */
export function useBestSupplyReserve(
  args: UseBestSupplyReserveArgs & Suspendable,
): SuspenseResult<Reserve>;

/**
 * Find the best supply reserve based on specified criteria.
 *
 * ```tsx
 * const { data, error, loading } = useBestSupplyReserve({
 *   query: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   filter: BestSupplyReserveFilter.HighestYield,
 * });
 * ```
 */
export function useBestSupplyReserve(
  args: UseBestSupplyReserveArgs,
): ReadResult<Reserve>;

export function useBestSupplyReserve({
  suspense = false,
  ...request
}: UseBestSupplyReserveArgs & {
  suspense?: boolean;
}): SuspendableResult<Reserve> {
  return useSuspendableQuery({
    document: BestSupplyReserveQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseReservesArgs = ReservesRequest;

/**
 * Fetch reserves based on specified criteria.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   filter: ReservesFilterRequest.All,
 *   orderBy: { name: 'ASC' },
 *   suspense: true,
 * });
 * ```
 */
export function useReserves(
  args: UseReservesArgs & Suspendable,
): SuspenseResult<Reserve[]>;

/**
 * Fetch reserves based on specified criteria.
 *
 * ```tsx
 * const { data, error, loading } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   filter: ReservesFilterRequest.All,
 *   orderBy: { name: 'ASC' },
 * });
 * ```
 */
export function useReserves(args: UseReservesArgs): ReadResult<Reserve[]>;

export function useReserves({
  suspense = false,
  ...request
}: UseReservesArgs & {
  suspense?: boolean;
}): SuspendableResult<Reserve[]> {
  return useSuspendableQuery({
    document: ReservesQuery,
    variables: {
      request,
    },
    suspense,
  });
}
