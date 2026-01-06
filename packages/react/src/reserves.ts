import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
  type UnexpectedError,
} from '@aave/client';
import { reserve, reserves } from '@aave/client/actions';
import {
  type ApySample,
  BorrowApyHistoryQuery,
  type BorrowApyHistoryRequest,
  type Reserve,
  ReserveQuery,
  type ReserveRequest,
  ReservesQuery,
  type ReservesRequest,
  SupplyApyHistoryQuery,
  type SupplyApyHistoryRequest,
} from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';
import { useAaveClient } from './context';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Selector,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  type UseAsyncTask,
  useAsyncTask,
  useSuspendableQuery,
} from './helpers';

export type UseReserveArgs = Prettify<
  ReserveRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch a specific reserve by reserve ID, spoke, and chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useReserve({
 *   reserve: reserveId('SGVsbG8h'),
 *   user: evmAddress('0xabc...'),
 *   suspense: true,
 * });
 * // data will be Reserve | null
 * ```
 */
export function useReserve(
  args: UseReserveArgs & Suspendable,
): SuspenseResult<Reserve | null>;
/**
 * Fetch a specific reserve by reserve ID, spoke, and chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useReserve({
 *   reserve: reserveId('SGVsbG8h'),
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useReserve(
  args: Pausable<UseReserveArgs> & Suspendable,
): PausableSuspenseResult<Reserve | null>;
/**
 * Fetch a specific reserve by reserve ID, spoke, and chain.
 *
 * ```tsx
 * const { data, error, loading } = useReserve({
 *   reserve: reserveId('SGVsbG8h'),
 *   user: evmAddress('0xabc...'),
 * });
 * // data will be Reserve | null
 * ```
 */
export function useReserve(args: UseReserveArgs): ReadResult<Reserve | null>;
/**
 * Fetch a specific reserve by reserve ID, spoke, and chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useReserve({
 *   reserve: reserveId('SGVsbG8h'),
 *   pause: true,
 * });
 * ```
 */
export function useReserve(
  args: Pausable<UseReserveArgs>,
): PausableReadResult<Reserve | null>;

export function useReserve({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseReserveArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Reserve | null, UnexpectedError> {
  return useSuspendableQuery({
    document: ReserveQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link reserve} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on the reserve.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useReserveAction();
 *
 * // …
 *
 * const result = await execute({
 *   reserve: reserveId('SGVsbG8h'),
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Reserve | null
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useReserveAction(
  options: Required<CurrencyQueryOptions> &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ReserveRequest, Reserve | null, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ReserveRequest) =>
      reserve(client, request, {
        currency: options.currency,
        timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
      }),
    [client, options.currency, options.timeWindow],
  );
}

export type UseReservesArgs<T = Reserve[]> = Prettify<
  ReservesRequest &
    CurrencyQueryOptions &
    TimeWindowQueryOptions & {
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
 *   filter: ReservesRequestFilter.All,
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useReserves<T = Reserve[]>(
  args: Pausable<UseReservesArgs<T>> & Suspendable,
): PausableSuspenseResult<T>;
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
 *   filter: ReservesRequestFilter.All,
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
/**
 * Fetch reserves based on specified criteria.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useReserves({
 *   query: {
 *     spoke: {
 *       address: evmAddress('0x123...'),
 *       chainId: chainId(1)
 *     }
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useReserves<T = Reserve[]>(
  args: Pausable<UseReservesArgs<T>>,
): PausableReadResult<T>;

export function useReserves<T = Reserve[]>({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  selector,
  ...request
}: NullishDeep<UseReservesArgs<T>> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<T, UnexpectedError> {
  return useSuspendableQuery({
    document: ReservesQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
    pause,
    selector: (selector || undefined) as Selector<Reserve[], T> | undefined,
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
 * **Reserves with Lowest Borrow APY**
 * ```ts
 * const [execute, { called, data, error, loading }] = useReservesAction();
 *
 * // …
 *
 * const result = await execute(…).map(pickLowestBorrowApyReserve);
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Reserve | null
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useReservesAction(
  options: Required<CurrencyQueryOptions> &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ReservesRequest, Reserve[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ReservesRequest) =>
      reserves(client, request, {
        currency: options.currency,
        timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
      }),
    [client, options.currency, options.timeWindow],
  );
}

export type UseBorrowApyHistoryArgs = BorrowApyHistoryRequest;

/**
 * Fetch borrow APY history for a specific reserve over time.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useBorrowApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useBorrowApyHistory(
  args: UseBorrowApyHistoryArgs & Suspendable,
): SuspenseResult<ApySample[]>;
/**
 * Fetch borrow APY history for a specific reserve over time.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useBorrowApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useBorrowApyHistory(
  args: Pausable<UseBorrowApyHistoryArgs> & Suspendable,
): PausableSuspenseResult<ApySample[]>;
/**
 * Fetch borrow APY history for a specific reserve over time.
 *
 * ```tsx
 * const { data, error, loading } = useBorrowApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useBorrowApyHistory(
  args: UseBorrowApyHistoryArgs,
): ReadResult<ApySample[]>;
/**
 * Fetch borrow APY history for a specific reserve over time.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useBorrowApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 *   pause: true,
 * });
 * ```
 */
export function useBorrowApyHistory(
  args: Pausable<UseBorrowApyHistoryArgs>,
): PausableReadResult<ApySample[]>;

export function useBorrowApyHistory({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseBorrowApyHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<ApySample[], UnexpectedError> {
  return useSuspendableQuery({
    document: BorrowApyHistoryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}

export type UseSupplyApyHistoryArgs = SupplyApyHistoryRequest;

/**
 * Fetch supply APY history for a specific reserve over time.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSupplyApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 * });
 * ```
 */
export function useSupplyApyHistory(
  args: UseSupplyApyHistoryArgs & Suspendable,
): SuspenseResult<ApySample[]>;
/**
 * Fetch supply APY history for a specific reserve over time.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSupplyApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useSupplyApyHistory(
  args: Pausable<UseSupplyApyHistoryArgs> & Suspendable,
): PausableSuspenseResult<ApySample[]>;
/**
 * Fetch supply APY history for a specific reserve over time.
 *
 * ```tsx
 * const { data, error, loading } = useSupplyApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 * });
 * ```
 */
export function useSupplyApyHistory(
  args: UseSupplyApyHistoryArgs,
): ReadResult<ApySample[]>;
/**
 * Fetch supply APY history for a specific reserve over time.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSupplyApyHistory({
 *   reserve: reserveId('SGVsbG8h'),
 *   window: TimeWindow.LastWeek,
 *   pause: true,
 * });
 * ```
 */
export function useSupplyApyHistory(
  args: Pausable<UseSupplyApyHistoryArgs>,
): PausableReadResult<ApySample[]>;

export function useSupplyApyHistory({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseSupplyApyHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<ApySample[], UnexpectedError> {
  return useSuspendableQuery({
    document: SupplyApyHistoryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}
