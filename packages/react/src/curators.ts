import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type UnexpectedError,
} from '@aave/client';
import {
  type ExternalCurator,
  ExternalCuratorQuery,
  type ExternalCuratorRequest,
  ExternalCuratorsQuery,
  type ExternalCuratorsRequest,
} from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';
import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseExternalCuratorArgs = Prettify<
  ExternalCuratorRequest & CurrencyQueryOptions
>;

/**
 * Fetch an external curator by ID.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useExternalCurator({
 *   id: 'curator-id',
 *   suspense: true,
 * });
 * // data will be ExternalCurator | null
 * ```
 */
export function useExternalCurator(
  args: UseExternalCuratorArgs & Suspendable,
): SuspenseResult<ExternalCurator | null>;
/**
 * Fetch an external curator by ID.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useExternalCurator({
 *   id: 'curator-id',
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useExternalCurator(
  args: Pausable<UseExternalCuratorArgs> & Suspendable,
): PausableSuspenseResult<ExternalCurator | null>;
/**
 * Fetch an external curator by ID.
 *
 * ```tsx
 * const { data, error, loading } = useExternalCurator({
 *   id: 'curator-id',
 * });
 * // data will be ExternalCurator | null
 * ```
 */
export function useExternalCurator(
  args: UseExternalCuratorArgs,
): ReadResult<ExternalCurator | null>;
/**
 * Fetch an external curator by ID.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useExternalCurator({
 *   id: 'curator-id',
 *   pause: true,
 * });
 * ```
 */
export function useExternalCurator(
  args: Pausable<UseExternalCuratorArgs>,
): PausableReadResult<ExternalCurator | null>;

export function useExternalCurator({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseExternalCuratorArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<ExternalCurator | null, UnexpectedError> {
  return useSuspendableQuery({
    document: ExternalCuratorQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}

export type UseExternalCuratorsArgs = Prettify<
  ExternalCuratorsRequest & CurrencyQueryOptions
>;

/**
 * Fetch the external curators holding a hub on the given chains.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useExternalCurators({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 * });
 * ```
 */
export function useExternalCurators(
  args: UseExternalCuratorsArgs & Suspendable,
): SuspenseResult<ExternalCurator[]>;
/**
 * Fetch the external curators holding a hub on the given chains.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useExternalCurators({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useExternalCurators(
  args: Pausable<UseExternalCuratorsArgs> & Suspendable,
): PausableSuspenseResult<ExternalCurator[]>;
/**
 * Fetch the external curators holding a hub on the given chains.
 *
 * ```tsx
 * const { data, error, loading } = useExternalCurators({
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 */
export function useExternalCurators(
  args: UseExternalCuratorsArgs,
): ReadResult<ExternalCurator[]>;
/**
 * Fetch the external curators holding a hub on the given chains.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useExternalCurators({
 *   query: { chainIds: [chainId(1)] },
 *   pause: true,
 * });
 * ```
 */
export function useExternalCurators(
  args: Pausable<UseExternalCuratorsArgs>,
): PausableReadResult<ExternalCurator[]>;

export function useExternalCurators({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  ...request
}: NullishDeep<UseExternalCuratorsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<ExternalCurator[], UnexpectedError> {
  return useSuspendableQuery({
    document: ExternalCuratorsQuery,
    variables: {
      request,
      currency,
    },
    suspense,
    pause,
  });
}
