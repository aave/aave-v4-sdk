import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client-next';
import { reserves } from '@aave/client-next/actions';
import {
  pickHighestSupplyApyReserve,
  pickLowestBorrowApyReserve,
} from '@aave/client-next/utils';
import {
  type Reserve,
  ReservesQuery,
  type ReservesRequest,
} from '@aave/graphql-next';
import type { Prettify } from '@aave/types-next';
import { useAaveClient } from './context';
import {
  type ReadResult,
  type Selector,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';

export type UseBestBorrowReserveArgs = Prettify<
  Pick<ReservesRequest, 'query'> & CurrencyQueryOptions
>;

/**
 * Find the best borrow reserve based on specified criteria.
 *
 * * @deprecated Use {@link useReserves} with {@link pickHighestSupplyApyReserve} instead.
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
 * @deprecated Use {@link useReserves} with {@link pickLowestBorrowApyReserve} instead.
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
    document: ReservesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    selector: pickLowestBorrowApyReserve,
  });
}

export type UseBestSupplyReserveArgs = Prettify<
  Pick<ReservesRequest, 'query'> & CurrencyQueryOptions
>;

/**
 * Find the best supply reserve based on specified criteria.
 *
 * @deprecated Use {@link useReserves} with {@link pickHighestSupplyApyReserve} instead.
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
 * @deprecated Use {@link useReserves} with {@link pickHighestSupplyApyReserve} instead.
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
    document: ReservesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    selector: pickHighestSupplyApyReserve,
  });
}

export type UseReservesArgs<T = Reserve[]> = Prettify<
  ReservesRequest &
    CurrencyQueryOptions & {
      /**
       * A function that maps the full list of reserves
       * into a derived or narrowed value.
       *
       * Example: pick a single reserve based on a criteria.
       *
       * @experimental This is experimental and may be subject to breaking changes.
       */
      selector?: Selector<Reserve[], T>;
    }
>;

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
 *
 * **Reserves with Highest Supply APY**
 * ```tsx
 * const { data } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   suspense: true,
 *   selector: pickHighestSupplyApyReserve,
 * });
 * ```
 *
 * **Reserves with Lowest Borrow APY**
 * ```tsx
 * const { data } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   suspense: true,
 *   selector: pickLowestBorrowApyReserve,
 * });
 * ```
 */
export function useReserves<T = Reserve[]>(
  args: UseReservesArgs<T> & Suspendable,
): SuspenseResult<T>;

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
 *
 * **Reserves with Highest Supply APY**
 * ```tsx
 * const { data } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   selector: pickHighestSupplyApyReserve,
 * });
 * ```
 *
 * **Reserves with Lowest Borrow APY**
 * ```tsx
 * const { data } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   selector: pickLowestBorrowApyReserve,
 * });
 * ```
 */
export function useReserves<T = Reserve[]>(
  args: UseReservesArgs<T>,
): ReadResult<T>;

export function useReserves<T = Reserve[]>({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  selector,
  ...request
}: UseReservesArgs<T> & {
  suspense?: boolean;
}): SuspendableResult<T> {
  return useSuspendableQuery({
    document: ReservesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    selector,
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
 *
 * **Reserves with Highest Supply APY**
 * ```ts
 * const [execute, { called, data, error, loading }] = useReservesAction();
 *
 * // …
 *
 * const result = await execute(…).map(pickHighestSupplyApyReserve);
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Reserve | null
 * } else {
 *   console.error(result.error);
 * }
 * ```
 *
 * **Reserves with Highest Supply APY**
 * ```ts
 * const [execute, { called, data, error, loading }] = useReservesAction();
 *
 * // …
 *
 * const result = await execute(…).map(pickHighestSupplyApyReserve);
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Reserve | null
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useReservesAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ReservesRequest, Reserve[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask((request: ReservesRequest) =>
    reserves(client, request, options),
  );
}

export type BestSupplyReserveRequest = Pick<ReservesRequest, 'query'>;

/**
 * Low-level hook to execute a {@link bestSupplyReserve} action directly.
 *
 * @deprecated Use {@link useReservesAction} with {@link pickHighestSupplyApyReserve} instead.
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
export function useBestSupplyReserveAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<BestSupplyReserveRequest, Reserve | null, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask((request: BestSupplyReserveRequest) =>
    reserves(client, request, options).map(pickHighestSupplyApyReserve),
  );
}
