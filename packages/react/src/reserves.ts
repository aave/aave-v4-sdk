import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client-next';
import { reserves } from '@aave/client-next/actions';
import {
  type APYSample,
  type BorrowAPYHistoryRequest,
  BorrowApyHistoryQuery,
  type Reserve,
  ReservesQuery,
  type ReservesRequest,
  type SupplyAPYHistoryRequest,
  SupplyApyHistoryQuery,
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

export type UseBorrowApyHistoryArgs = BorrowAPYHistoryRequest;

/**
 * Fetch borrow APY history for a specific reserve over time.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useBorrowApyHistory({
 *   spoke: {
 *     address: evmAddress('0x123...'),
 *     chainId: chainId(1)
 *   },
 *   reserve: reserveId(1),
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useBorrowApyHistory(
  args: UseBorrowApyHistoryArgs & Suspendable,
): SuspenseResult<APYSample[]>;

/**
 * Fetch borrow APY history for a specific reserve over time.
 *
 * ```tsx
 * const { data, error, loading } = useBorrowApyHistory({
 *   spoke: {
 *     address: evmAddress('0x123...'),
 *     chainId: chainId(1)
 *   },
 *   reserve: reserveId(1),
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useBorrowApyHistory(
  args: UseBorrowApyHistoryArgs,
): ReadResult<APYSample[]>;

export function useBorrowApyHistory({
  suspense = false,
  ...request
}: UseBorrowApyHistoryArgs & {
  suspense?: boolean;
}): SuspendableResult<APYSample[]> {
  return useSuspendableQuery({
    document: BorrowApyHistoryQuery,
    variables: {
      request,
    },
    suspense,
  });
}

export type UseSupplyApyHistoryArgs = SupplyAPYHistoryRequest;

/**
 * Fetch supply APY history for a specific reserve over time.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSupplyApyHistory({
 *   spoke: {
 *     address: evmAddress('0x123...'),
 *     chainId: chainId(1)
 *   },
 *   reserve: reserveId(1),
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useSupplyApyHistory(
  args: UseSupplyApyHistoryArgs & Suspendable,
): SuspenseResult<APYSample[]>;

/**
 * Fetch supply APY history for a specific reserve over time.
 *
 * ```tsx
 * const { data, error, loading } = useSupplyApyHistory({
 *   spoke: {
 *     address: evmAddress('0x123...'),
 *     chainId: chainId(1)
 *   },
 *   reserve: reserveId(1),
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useSupplyApyHistory(
  args: UseSupplyApyHistoryArgs,
): ReadResult<APYSample[]>;

export function useSupplyApyHistory({
  suspense = false,
  ...request
}: UseSupplyApyHistoryArgs & {
  suspense?: boolean;
}): SuspendableResult<APYSample[]> {
  return useSuspendableQuery({
    document: SupplyApyHistoryQuery,
    variables: {
      request,
    },
    suspense,
  });
}
