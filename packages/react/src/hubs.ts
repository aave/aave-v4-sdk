import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client';
import { hubs } from '@aave/client/actions';
import {
  type Hub,
  type HubAsset,
  HubAssetsQuery,
  type HubAssetsRequest,
  HubQuery,
  type HubRequest,
  HubsQuery,
  type HubsRequest,
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

export type UseHubArgs = Prettify<HubRequest & CurrencyQueryOptions>;

/**
 * Fetch a specific hub by ID or by address and chain ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useHub({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   suspense: true,
 * });
 * // data will be Hub | null
 * ```
 */
export function useHub(
  args: UseHubArgs & Suspendable,
): SuspenseResult<Hub | null>;
/**
 * Fetch a specific hub by ID or by address and chain ID.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useHub({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useHub(
  args: Pausable<UseHubArgs> & Suspendable,
): PausableSuspenseResult<Hub | null>;
/**
 * Fetch a specific hub by ID or by address and chain ID.
 *
 * ```tsx
 * const { data, error, loading } = useHub({
 *   query: { hubId: hubId('SGVsbG8h') },
 * });
 * // data will be Hub | null
 * ```
 */
export function useHub(args: UseHubArgs): ReadResult<Hub | null>;
/**
 * Fetch a specific hub by ID or by address and chain ID.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useHub({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   pause: true,
 * });
 * ```
 */
export function useHub(
  args: Pausable<UseHubArgs>,
): PausableReadResult<Hub | null>;

export function useHub({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseHubArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Hub | null, UnexpectedError> {
  return useSuspendableQuery({
    document: HubQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

export type UseHubsArgs = Prettify<HubsRequest & CurrencyQueryOptions>;

/**
 * Fetch multiple hubs based on specified criteria.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useHubs({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 * });
 * ```
 */
export function useHubs(args: UseHubsArgs & Suspendable): SuspenseResult<Hub[]>;
/**
 * Fetch multiple hubs based on specified criteria.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useHubs({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useHubs(
  args: Pausable<UseHubsArgs> & Suspendable,
): PausableSuspenseResult<Hub[]>;
/**
 * Fetch multiple hubs based on specified criteria.
 *
 * ```tsx
 * const { data, error, loading } = useHubs({
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 */
export function useHubs(args: UseHubsArgs): ReadResult<Hub[]>;
/**
 * Fetch multiple hubs based on specified criteria.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useHubs({
 *   query: { chainIds: [chainId(1)] },
 *   pause: true,
 * });
 * ```
 */
export function useHubs(args: Pausable<UseHubsArgs>): PausableReadResult<Hub[]>;

export function useHubs({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseHubsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Hub[], UnexpectedError> {
  return useSuspendableQuery({
    document: HubsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

export type UseHubAssetsArgs = Prettify<
  HubAssetsRequest & CurrencyQueryOptions
>;

/**
 * Fetch hub assets for a specific hub by ID or by address and chain ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useHubAssets({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   user: evmAddress('0x456...'), // optional
 *   suspense: true,
 * });
 * ```
 */
export function useHubAssets(
  args: UseHubAssetsArgs & Suspendable,
): SuspenseResult<HubAsset[]>;
/**
 * Fetch hub assets for a specific hub by ID or by address and chain ID.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useHubAssets({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   user: evmAddress('0x456...'), // optional
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useHubAssets(
  args: Pausable<UseHubAssetsArgs> & Suspendable,
): PausableSuspenseResult<HubAsset[]>;
/**
 * Fetch hub assets for a specific hub by ID or by address and chain ID.
 *
 * ```tsx
 * const { data, error, loading } = useHubAssets({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   user: evmAddress('0x456...'), // optional
 * });
 * ```
 */
export function useHubAssets(args: UseHubAssetsArgs): ReadResult<HubAsset[]>;
/**
 * Fetch hub assets for a specific hub by ID or by address and chain ID.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useHubAssets({
 *   query: { hubId: hubId('SGVsbG8h') },
 *   user: evmAddress('0x456...'), // optional
 *   pause: true,
 * });
 * ```
 */
export function useHubAssets(
  args: Pausable<UseHubAssetsArgs>,
): PausableReadResult<HubAsset[]>;

export function useHubAssets({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseHubAssetsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<HubAsset[], UnexpectedError> {
  return useSuspendableQuery({
    document: HubAssetsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

/**
 * Low-level hook to execute a {@link hubs} action directly.
 *
 * @experimental This hook is experimental and may be subject to breaking changes.
 * @remarks
 * This hook **does not** actively watch for updated data on the hubs.
 * Use this hook to retrieve data on demand as part of a larger workflow
 * (e.g., in an event handler in order to move to the next step).
 *
 * ```ts
 * const [execute, { called, data, error, loading }] = useHubsAction();
 *
 * // …
 *
 * const result = await execute({
 *   query: {
 *     chainIds: [chainId(1)]
 *   }
 * });
 *
 * if (result.isOk()) {
 *   console.log(result.value); // Hub[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function useHubsAction(
  options: Required<CurrencyQueryOptions> = DEFAULT_QUERY_OPTIONS,
): UseAsyncTask<HubsRequest, Hub[], UnexpectedError> {
  const client = useAaveClient();

  return useAsyncTask(
    (request: HubsRequest) =>
      hubs(client, request, { currency: options.currency }),
    [client, options.currency],
  );
}
