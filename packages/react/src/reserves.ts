import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  HubAssetHoldersQuery,
  type HubAssetHoldersRequest,
  type ReserveTrailingSupplyApys,
  ReserveTrailingSupplyApysQuery,
  type ReserveTrailingSupplyApysRequest,
  type TimeWindowQueryOptions,
  type UnexpectedError,
} from '@aave/client';
import { reserve, reserveHolders, reserves } from '@aave/client/actions';
import {
  type ApySample,
  BorrowApyHistoryQuery,
  type BorrowApyHistoryRequest,
  type PaginatedReserveHoldersResult,
  type Reserve,
  ReserveHoldersQuery,
  type ReserveHoldersRequest,
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
  options: CurrencyQueryOptions &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ReserveRequest, Reserve | null, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ReserveRequest) =>
      reserve(client, request, {
        currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
        timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
        requestPolicy: 'cache-first',
      }),
    [client, options.currency, options.timeWindow],
  );
}

export type UseReservesArgs = Prettify<
  ReservesRequest & CurrencyQueryOptions & TimeWindowQueryOptions
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
 */
export function useReserves(
  args: UseReservesArgs & Suspendable,
): SuspenseResult<Reserve[]>;
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
export function useReserves(
  args: Pausable<UseReservesArgs> & Suspendable,
): PausableSuspenseResult<Reserve[]>;
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
 */
export function useReserves(
  args: UseReservesArgs,
): ReadResult<Reserve[], UnexpectedError>;
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
export function useReserves(
  args: Pausable<UseReservesArgs>,
): PausableReadResult<Reserve[], UnexpectedError>;

export function useReserves({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseReservesArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Reserve[], UnexpectedError> {
  return useSuspendableQuery({
    document: ReservesQuery,
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
export function useReservesAction(
  options: CurrencyQueryOptions &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ReservesRequest, Reserve[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ReservesRequest) =>
      reserves(client, request, {
        currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
        timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
        requestPolicy: 'cache-first',
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

export type UseReserveHoldersArgs = Prettify<
  ReserveHoldersRequest & CurrencyQueryOptions
>;

/**
 * Fetch a paginated list of top holders for a specific reserve.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useReserveHolders({
 *   reserve: { reserveId: reserveId('SGVsbG8h') },
 *   filter: ReserveHoldersFilter.Supplied,
 *   suspense: true,
 * });
 *
 * // data.items: ReserveHolder[]
 * ```
 */
export function useReserveHolders(
  args: UseReserveHoldersArgs & Suspendable,
): SuspenseResult<PaginatedReserveHoldersResult>;
/**
 * Fetch a paginated list of top holders for a specific reserve.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useReserveHolders({
 *   reserve: { reserveId: reserveId('SGVsbG8h') },
 *   filter: ReserveHoldersFilter.Supplied,
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useReserveHolders(
  args: Pausable<UseReserveHoldersArgs> & Suspendable,
): PausableSuspenseResult<PaginatedReserveHoldersResult>;
/**
 * Fetch a paginated list of top holders for a specific reserve.
 *
 * ```tsx
 * const { data, error, loading } = useReserveHolders({
 *   reserve: { reserveId: reserveId('SGVsbG8h') },
 *   filter: ReserveHoldersFilter.Supplied,
 * });
 * ```
 */
export function useReserveHolders(
  args: UseReserveHoldersArgs,
): ReadResult<PaginatedReserveHoldersResult>;
/**
 * Fetch a paginated list of top holders for a specific reserve.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useReserveHolders({
 *   reserve: { reserveId: reserveId('SGVsbG8h') },
 *   filter: ReserveHoldersFilter.Supplied,
 *   pause: true,
 * });
 * ```
 */
export function useReserveHolders(
  args: Pausable<UseReserveHoldersArgs>,
): PausableReadResult<PaginatedReserveHoldersResult>;

export function useReserveHolders({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseReserveHoldersArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedReserveHoldersResult, UnexpectedError> {
  return useSuspendableQuery({
    document: ReserveHoldersQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link reserveHolders} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on the reserve holders.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler when paginating).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useReserveHoldersAction();
 *
 * // …
 *
 * const result = await execute({
 *   reserve: { reserveId: reserveId('SGVsbG8h') },
 *   filter: ReserveHoldersFilter.Supplied,
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // PaginatedReserveHoldersResult
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useReserveHoldersAction(
  options: CurrencyQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<
  ReserveHoldersRequest,
  PaginatedReserveHoldersResult,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ReserveHoldersRequest) =>
      reserveHolders(client, request, {
        currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
        requestPolicy: 'cache-first',
      }),
    [client, options.currency],
  );
}

export type UseHubAssetHoldersArgs = Prettify<
  HubAssetHoldersRequest & CurrencyQueryOptions
>;

/**
 * Fetch a paginated list of top holders for a hub asset or a single reserve.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useHubAssetHolders({ …, suspense: true });
 * ```
 */
export function useHubAssetHolders(
  args: UseHubAssetHoldersArgs & Suspendable,
): SuspenseResult<PaginatedReserveHoldersResult>;
/**
 * Fetch a paginated list of top holders for a hub asset or a single reserve.
 *
 * Pausable suspense mode.
 */
export function useHubAssetHolders(
  args: Pausable<UseHubAssetHoldersArgs> & Suspendable,
): PausableSuspenseResult<PaginatedReserveHoldersResult>;
/**
 * Fetch a paginated list of top holders for a hub asset or a single reserve.
 *
 * ```tsx
 * const { data, error, loading } = useHubAssetHolders({ … });
 * ```
 */
export function useHubAssetHolders(
  args: UseHubAssetHoldersArgs,
): ReadResult<PaginatedReserveHoldersResult>;
/**
 * Fetch a paginated list of top holders for a hub asset or a single reserve.
 *
 * Pausable loading state mode.
 */
export function useHubAssetHolders(
  args: Pausable<UseHubAssetHoldersArgs>,
): PausableReadResult<PaginatedReserveHoldersResult>;

export function useHubAssetHolders({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseHubAssetHoldersArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedReserveHoldersResult, UnexpectedError> {
  return useSuspendableQuery({
    document: HubAssetHoldersQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

export type UseReserveTrailingSupplyApysArgs = ReserveTrailingSupplyApysRequest;

/**
 * Fetch the trailing average supply APY over the last 7, 30 and 90 days for a reserve.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useReserveTrailingSupplyApys({ …, suspense: true });
 * ```
 */
export function useReserveTrailingSupplyApys(
  args: UseReserveTrailingSupplyApysArgs & Suspendable,
): SuspenseResult<ReserveTrailingSupplyApys | null>;
/**
 * Fetch the trailing average supply APY over the last 7, 30 and 90 days for a reserve.
 *
 * Pausable suspense mode.
 */
export function useReserveTrailingSupplyApys(
  args: Pausable<UseReserveTrailingSupplyApysArgs> & Suspendable,
): PausableSuspenseResult<ReserveTrailingSupplyApys | null>;
/**
 * Fetch the trailing average supply APY over the last 7, 30 and 90 days for a reserve.
 *
 * ```tsx
 * const { data, error, loading } = useReserveTrailingSupplyApys({ … });
 * ```
 */
export function useReserveTrailingSupplyApys(
  args: UseReserveTrailingSupplyApysArgs,
): ReadResult<ReserveTrailingSupplyApys | null>;
/**
 * Fetch the trailing average supply APY over the last 7, 30 and 90 days for a reserve.
 *
 * Pausable loading state mode.
 */
export function useReserveTrailingSupplyApys(
  args: Pausable<UseReserveTrailingSupplyApysArgs>,
): PausableReadResult<ReserveTrailingSupplyApys | null>;

export function useReserveTrailingSupplyApys({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseReserveTrailingSupplyApysArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<ReserveTrailingSupplyApys | null, UnexpectedError> {
  return useSuspendableQuery({
    document: ReserveTrailingSupplyApysQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}
