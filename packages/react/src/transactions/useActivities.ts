import {
  type ActivitiesRequest,
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type PaginatedActivitiesResult,
  type TimeWindowQueryOptions,
  type UnexpectedError,
} from '@aave/client';
import { activities } from '@aave/client/actions';
import { ActivitiesQuery } from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';

import { useAaveClient } from '../context';
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
} from '../helpers';

export type UseActivitiesArgs = Prettify<
  ActivitiesRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch paginated list of activities.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 * });
 *
 * // data.items: ActivityItem[]
 * ```
 */
export function useActivities(
  args: UseActivitiesArgs & Suspendable,
): SuspenseResult<PaginatedActivitiesResult>;
/**
 * Fetch paginated list of activities.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 *   suspense: true,
 *   pause: true,
 * });
 *
 * // data?.items: ActivityItem[] | undefined
 * ```
 */
export function useActivities(
  args: Pausable<UseActivitiesArgs> & Suspendable,
): PausableSuspenseResult<PaginatedActivitiesResult>;
/**
 * Fetch paginated list of activities.
 *
 * ```tsx
 * const { data, error, loading } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 * });
 * ```
 */
export function useActivities(
  args: UseActivitiesArgs,
): ReadResult<PaginatedActivitiesResult>;
/**
 * Fetch paginated list of activities.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading } = useActivities({
 *   query: {
 *     chainId: chainId(1),
 *   },
 *   user: evmAddress('0x742d35cc…'),
 *   pause: true,
 * });
 *
 * // data?.items: ActivityItem[] | undefined
 * // error: UnexpectedError | undefined
 * // loading: boolean | undefined
 * ```
 */
export function useActivities(
  args: Pausable<UseActivitiesArgs>,
): PausableReadResult<PaginatedActivitiesResult>;

export function useActivities({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseActivitiesArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedActivitiesResult, UnexpectedError> {
  return useSuspendableQuery({
    document: ActivitiesQuery,
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
 * Low-level hook to execute a {@link activities} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook does not actively watch for updates. Use it to fetch activities on demand
 * (e.g., in an event handler when paginating or refining filters).
 *
 * @param options - The query options.
 * @returns The user history.
 */
export function useActivitiesAction(
  options: CurrencyQueryOptions &
    TimeWindowQueryOptions = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<ActivitiesRequest, PaginatedActivitiesResult, UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: ActivitiesRequest) =>
      activities(client, request, {
        currency: options.currency ?? DEFAULT_QUERY_OPTIONS.currency,
        timeWindow: options.timeWindow ?? DEFAULT_QUERY_OPTIONS.timeWindow,
        requestPolicy: 'cache-first',
      }),
    [client, options.currency, options.timeWindow],
  );
}
