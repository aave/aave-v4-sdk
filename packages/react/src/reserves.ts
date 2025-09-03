import {
  BestBorrowReserveQuery,
  type BestBorrowReserveRequest,
  BestSupplyReserveQuery,
  type BestSupplyReserveRequest,
  type Reserve,
} from '@aave/graphql';
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
