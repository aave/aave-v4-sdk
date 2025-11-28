import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
  type UnexpectedError,
} from '@aave/client';
import type { UserPositionQueryOptions } from '@aave/client/actions';
import {
  userBalances,
  userBorrows,
  userPositions,
  userSupplies,
} from '@aave/client/actions';
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
  type UserSummaryHistoryItem,
  UserSummaryHistoryQuery,
  type UserSummaryHistoryRequest,
  UserSummaryQuery,
  type UserSummaryRequest,
  UserSuppliesQuery,
  type UserSuppliesRequest,
  type UserSupplyItem,
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
 * Pausable suspense mode.
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
 *   pause: true,
 * });
 *
 * // data?.length: number | undefined
 * ```
 */
export function useUserSupplies(
  args: Pausable<UseUserSuppliesArgs> & Suspendable,
): PausableSuspenseResult<UserSupplyItem[]>;
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
/**
 * Fetch all user supply positions.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserSupplies({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 *   pause: true,
 * });
 *
 * // data?.length: number | undefined
 * // error: UnexpectedError | undefined
 * // loading: boolean | undefined
 * // paused: boolean
 * ```
 */
export function useUserSupplies(
  args: Pausable<UseUserSuppliesArgs>,
): PausableReadResult<UserSupplyItem[]>;

export function useUserSupplies({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseUserSuppliesArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserSupplyItem[], UnexpectedError> {
  return useSuspendableQuery({
    document: UserSuppliesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link userSupplies} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on user supplies.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useUserSuppliesAction();
 *
 * // …
 *
 * const result = await execute({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // UserSupplyItem[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useUserSuppliesAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<UserSuppliesRequest, UserSupplyItem[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UserSuppliesRequest) =>
      userSupplies(client, request, { currency: options.currency }),
    [client, options.currency],
  );
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
 * Pausable suspense mode.
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
 *   pause: true,
 * });
 * ```
 */
export function useUserBorrows(
  args: Pausable<UseUserBorrowsArgs> & Suspendable,
): PausableSuspenseResult<UserBorrowItem[]>;
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
/**
 * Fetch all user borrow positions.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserBorrows({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 *   pause: true,
 * });
 * ```
 */
export function useUserBorrows(
  args: Pausable<UseUserBorrowsArgs>,
): PausableReadResult<UserBorrowItem[]>;

export function useUserBorrows({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseUserBorrowsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserBorrowItem[], UnexpectedError> {
  return useSuspendableQuery({
    document: UserBorrowsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link userBorrows} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on user borrows.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useUserBorrowsAction();
 *
 * // …
 *
 * const result = await execute({
 *   query: {
 *     userSpoke: {
 *       spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *       user: evmAddress('0x742d35cc…'),
 *     },
 *   },
 *   orderBy: { name: 'ASC' },
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // UserBorrowItem[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useUserBorrowsAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<UserBorrowsRequest, UserBorrowItem[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UserBorrowsRequest) =>
      userBorrows(client, request, { currency: options.currency }),
    [client, options.currency],
  );
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserSummary({
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *   },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserSummary(
  args: Pausable<UseUserSummaryArgs> & Suspendable,
): PausableSuspenseResult<UserSummary>;
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
/**
 * Fetch a user's financial summary.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserSummary({
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     spoke: { address: evmAddress('0x87870bca…'), chainId: chainId(1) },
 *   },
 *   pause: true,
 * });
 * ```
 */
export function useUserSummary(
  args: Pausable<UseUserSummaryArgs>,
): PausableReadResult<UserSummary>;

export function useUserSummary({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseUserSummaryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserSummary, UnexpectedError> {
  return useSuspendableQuery({
    document: UserSummaryQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
    pause,
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserPositions({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   orderBy: { balance: 'DESC' },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserPositions(
  args: Pausable<UseUserPositionsArgs> & Suspendable,
): PausableSuspenseResult<UserPosition[]>;
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
/**
 * Fetch all user positions across specified chains.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserPositions({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   orderBy: { balance: 'DESC' },
 *   pause: true,
 * });
 * ```
 */
export function useUserPositions(
  args: Pausable<UseUserPositionsArgs>,
): PausableReadResult<UserPosition[]>;

export function useUserPositions({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseUserPositionsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserPosition[], UnexpectedError> {
  return useSuspendableQuery({
    document: UserPositionsQuery,
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
 * Low-level hook to execute a {@link userPositions} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on user positions.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useUserPositionsAction();
 *
 * // …
 *
 * const result = await execute({
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 *   orderBy: { balance: 'DESC' },
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // UserPosition[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useUserPositionsAction(
  options: UserPositionQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<UserPositionsRequest, UserPosition[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UserPositionsRequest) =>
      userPositions(client, request, {
        currency: options.currency,
        timeWindow: options.timeWindow,
      }),
    [client, options.currency, options.timeWindow],
  );
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
 *   id: userPositionId('SGVsbG8h'),
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserPosition({
 *   id: userPositionId('SGVsbG8h'),
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserPosition(
  args: Pausable<UseUserPositionArgs> & Suspendable,
): PausableSuspenseResult<UserPosition>;
/**
 * Fetch a specific user position by ID.
 *
 * ```tsx
 * const { data, error, loading } = useUserPosition({
 *   id: userPositionId('SGVsbG8h'),
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 */
export function useUserPosition(
  args: UseUserPositionArgs,
): ReadResult<UserPosition>;
/**
 * Fetch a specific user position by ID.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserPosition({
 *   id: userPositionId('SGVsbG8h'),
 *   user: evmAddress('0x742d35cc…'),
 *   pause: true,
 * });
 * ```
 */
export function useUserPosition(
  args: Pausable<UseUserPositionArgs>,
): PausableReadResult<UserPosition>;

export function useUserPosition({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseUserPositionArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserPosition | null, UnexpectedError> {
  return useSuspendableQuery({
    document: UserPositionQuery,
    variables: {
      request,
      currency,
      timeWindow,
    },
    suspense,
    pause,
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserBalances({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserBalances(
  args: Pausable<UseUserBalancesArgs> & Suspendable,
): PausableSuspenseResult<UserBalance[]>;
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
/**
 * Fetch all user balances across specified chains.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserBalances({
 *   user: evmAddress('0x742d35cc…'),
 *   chainIds: [chainId(1), chainId(137)],
 *   pause: true,
 * });
 * ```
 */
export function useUserBalances(
  args: Pausable<UseUserBalancesArgs>,
): PausableReadResult<UserBalance[]>;

export function useUserBalances({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseUserBalancesArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserBalance[], UnexpectedError> {
  return useSuspendableQuery({
    document: UserBalancesQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link userBalances} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on user balances.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useUserBalancesAction();
 *
 * // …
 *
 * const result = await execute({
 *   user: evmAddress('0x742d35cc…'),
 *   filter: {
 *     chainIds: [chainId(1), chainId(137)]
 *   },
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // UserBalance[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useUserBalancesAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<UserBalancesRequest, UserBalance[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: UserBalancesRequest) =>
      userBalances(client, request, { currency: options.currency }),
    [client, options.currency],
  );
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
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserSummaryHistory({
 *   user: evmAddress('0x742d35cc…'),
 *   window: TimeWindow.LastWeek,
 *   filter: { chainIds: [chainId(1)] },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserSummaryHistory(
  args: Pausable<UseUserSummaryHistoryArgs> & Suspendable,
): PausableSuspenseResult<UserSummaryHistoryItem[]>;
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
/**
 * Fetch user summary history over time.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserSummaryHistory({
 *   user: evmAddress('0x742d35cc…'),
 *   window: TimeWindow.LastWeek,
 *   filter: { chainIds: [chainId(1)] },
 *   pause: true,
 * });
 * ```
 */
export function useUserSummaryHistory(
  args: Pausable<UseUserSummaryHistoryArgs>,
): PausableReadResult<UserSummaryHistoryItem[]>;

export function useUserSummaryHistory({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseUserSummaryHistoryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<UserSummaryHistoryItem[], UnexpectedError> {
  return useSuspendableQuery({
    document: UserSummaryHistoryQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
    batch: false, // Do not batch this since it's a slower than average query
  });
}
