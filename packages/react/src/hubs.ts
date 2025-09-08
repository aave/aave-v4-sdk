import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
} from '@aave/client-next';
import {
  type Hub,
  HubQuery,
  type HubRequest,
  HubsQuery,
  type HubsRequest,
} from '@aave/graphql-next';
import type { Prettify } from '@aave/types-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseHubArgs = Prettify<HubRequest & CurrencyQueryOptions>;

/**
 * Fetch a specific hub by address and chain ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useHub({
 *   hub: evmAddress('0x123...'),
 *   chainId: chainId(1),
 *   suspense: true,
 * });
 * // data will be Hub | null
 * ```
 */
export function useHub(
  args: UseHubArgs & Suspendable,
): SuspenseResult<Hub | null>;

/**
 * Fetch a specific hub by address and chain ID.
 *
 * ```tsx
 * const { data, error, loading } = useHub({
 *   hub: evmAddress('0x123...'),
 *   chainId: chainId(1),
 * });
 * // data will be Hub | null
 * ```
 */
export function useHub(args: UseHubArgs): ReadResult<Hub | null>;

export function useHub({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseHubArgs & {
  suspense?: boolean;
}): SuspendableResult<Hub | null> {
  return useSuspendableQuery({
    document: HubQuery,
    variables: {
      request,
      currency,
    },
    suspense,
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
 *   chainIds: [chainId(1), chainId(137)],
 *   suspense: true,
 * });
 * ```
 */
export function useHubs(args: UseHubsArgs & Suspendable): SuspenseResult<Hub[]>;

/**
 * Fetch multiple hubs based on specified criteria.
 *
 * ```tsx
 * const { data, error, loading } = useHubs({
 *   chainIds: [chainId(1), chainId(137)],
 * });
 * ```
 */
export function useHubs(args: UseHubsArgs): ReadResult<Hub[]>;

export function useHubs({
  suspense = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: UseHubsArgs & {
  suspense?: boolean;
}): SuspendableResult<Hub[]> {
  return useSuspendableQuery({
    document: HubsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
  });
}
