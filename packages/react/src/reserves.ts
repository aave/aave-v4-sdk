import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client-next';
import { bestSupplyReserve, reserves } from '@aave/client-next/actions';
import {
  BestBorrowReserveQuery,
  type BestBorrowReserveRequest,
  BestSupplyReserveQuery,
  type BestSupplyReserveRequest,
  type Reserve,
  ReservesQuery,
  type ReservesRequest,
} from '@aave/graphql-next';
import type { Prettify } from '@aave/types-next';
import { useAaveClient } from './context';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';

export type UseBestBorrowReserveArgs = Prettify<
  BestBorrowReserveRequest & CurrencyQueryOptions
>;

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
): SuspenseResult<Reserve | null>;

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
): ReadResult<Reserve | null>;

export function useBestBorrowReserve({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseBestBorrowReserveArgs & {
  suspense?: boolean;
}): SuspendableResult<Reserve | null> {
  return useSuspendableQuery({
    document: BestBorrowReserveQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

export type UseBestSupplyReserveArgs = Prettify<
  BestSupplyReserveRequest & CurrencyQueryOptions
>;

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
): SuspenseResult<Reserve | null>;

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
): ReadResult<Reserve | null>;

export function useBestSupplyReserve({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseBestSupplyReserveArgs & {
  suspense?: boolean;
}): SuspendableResult<Reserve | null> {
  return useSuspendableQuery({
    document: BestSupplyReserveQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

export type UseReservesArgs = Prettify<ReservesRequest & CurrencyQueryOptions>;

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
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseReservesArgs & {
  suspense?: boolean;
}): SuspendableResult<Reserve[]> {
  return useSuspendableQuery({
    document: ReservesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}

/**
 * Low-level hook to execute a {@link reserves} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on the reserves.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useReservesAction();
 *
 * // …
 *
 * const result = await execute({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x1234…'),
 *       chainId: chainId(1)
 *     }
 *   }
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Reserve[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useReservesAction(): UseAsyncTask<
  ReservesRequest,
  Reserve[],
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: ReservesRequest) => reserves(client, request));
}

/**
 * Low-level hook to execute a {@link bestSupplyReserve} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on the best supply reserve.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useBestSupplyReserveAction();
 *
 * // …
 *
 * const result = await execute({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x1234…'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   filter: BestSupplyReserveFilter.HighestYield
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Reserve | null
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useBestSupplyReserveAction(): UseAsyncTask<
  BestSupplyReserveRequest,
  Reserve | null,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: BestSupplyReserveRequest) =>
    bestSupplyReserve(client, request),
  );
}
