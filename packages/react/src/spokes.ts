import type { UnexpectedError } from '@aave/client-next';
import {
  type PaginatedSpokePositionManagerResult,
  type PaginatedSpokeUserPositionManagerResult,
  type Spoke,
  SpokePositionManagersQuery,
  type SpokePositionManagersRequest,
  SpokesQuery,
  type SpokesRequest,
  SpokeUserPositionManagersQuery,
  type SpokeUserPositionManagersRequest,
} from '@aave/graphql-next';
import type { NullishDeep } from '@aave/types-next';
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

export type UseSpokesArgs = SpokesRequest;

/**
 * Fetch spokes based on specified criteria.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSpokes({
 *     chainIds: [chainId(1)],
 *     suspense: true,
 * });
 * ```
 */
export function useSpokes(
  args: UseSpokesArgs & Suspendable,
): SuspenseResult<Spoke[]>;
/**
 * Fetch spokes based on specified criteria.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSpokes({
 *     chainIds: [chainId(1)],
 *     suspense: true,
 *     pause: true,
 * });
 * ```
 */
export function useSpokes(
  args: Pausable<UseSpokesArgs> & Suspendable,
): PausableSuspenseResult<Spoke[]>;
/**
 * Fetch spokes based on specified criteria.
 *
 * ```tsx
 * const { data, error, loading } = useSpokes({
 *     chainIds: [chainId(1)],
 *   },
 * });
 * ```
 */
export function useSpokes(args: UseSpokesArgs): ReadResult<Spoke[]>;
/**
 * Fetch spokes based on specified criteria.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSpokes({
 *     chainIds: [chainId(1)],
 *     pause: true,
 * });
 * ```
 */
export function useSpokes(
  args: Pausable<UseSpokesArgs>,
): PausableReadResult<Spoke[]>;

export function useSpokes({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseSpokesArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Spoke[], UnexpectedError, boolean> {
  return useSuspendableQuery({
    document: SpokesQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}

export type UseSpokePositionManagersArgs = SpokePositionManagersRequest;

/**
 * Fetches all the positions manager for a specific spoke.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSpokePositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     suspense: true,
 * });
 * ```
 */
export function useSpokePositionManagers(
  args: UseSpokePositionManagersArgs & Suspendable,
): SuspenseResult<PaginatedSpokePositionManagerResult>;
/**
 * Fetches all the positions manager for a specific spoke.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSpokePositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     suspense: true,
 *     pause: true,
 * });
 * ```
 */
export function useSpokePositionManagers(
  args: Pausable<UseSpokePositionManagersArgs> & Suspendable,
): PausableSuspenseResult<PaginatedSpokePositionManagerResult>;
/**
 * Fetches all the positions manager for a specific spoke.
 *
 * ```tsx
 * const { data, error, loading } = useSpokePositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *   },
 * });
 * ```
 */
export function useSpokePositionManagers(
  args: UseSpokePositionManagersArgs,
): ReadResult<PaginatedSpokePositionManagerResult>;
/**
 * Fetches all the positions manager for a specific spoke.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSpokePositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     pause: true,
 * });
 * ```
 */
export function useSpokePositionManagers(
  args: Pausable<UseSpokePositionManagersArgs>,
): PausableReadResult<PaginatedSpokePositionManagerResult>;

export function useSpokePositionManagers({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseSpokePositionManagersArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  PaginatedSpokePositionManagerResult,
  UnexpectedError,
  boolean
> {
  return useSuspendableQuery({
    document: SpokePositionManagersQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}

export type UseSpokeUserPositionManagersArgs = SpokeUserPositionManagersRequest;

/**
 * Fetches all the position managers of a user for a specific spoke
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSpokeUserPositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     user: evmAddress('0x123...'),
 *     suspense: true,
 * });
 * ```
 */
export function useSpokeUserPositionManagers(
  args: UseSpokeUserPositionManagersArgs & Suspendable,
): SuspenseResult<PaginatedSpokeUserPositionManagerResult>;
/**
 * Fetches all the position managers of a user for a specific spoke
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSpokeUserPositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     user: evmAddress('0x123...'),
 *     suspense: true,
 *     pause: true,
 * });
 * ```
 */
export function useSpokeUserPositionManagers(
  args: Pausable<UseSpokeUserPositionManagersArgs> & Suspendable,
): PausableSuspenseResult<PaginatedSpokeUserPositionManagerResult>;
/**
 * Fetches all the position managers of a user for a specific spoke
 *
 * ```tsx
 * const { data, error, loading } = useSpokeUserPositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     user: evmAddress('0x123...'),
 *   },
 * });
 * ```
 */
export function useSpokeUserPositionManagers(
  args: UseSpokeUserPositionManagersArgs,
): ReadResult<PaginatedSpokeUserPositionManagerResult>;
/**
 * Fetches all the position managers of a user for a specific spoke
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSpokeUserPositionManagers({
 *     spoke: {
 *       chainId: chainId(1),
 *       address: evmAddress('0x878...'),
 *     },
 *     user: evmAddress('0x123...'),
 *     pause: true,
 * });
 * ```
 */
export function useSpokeUserPositionManagers(
  args: Pausable<UseSpokeUserPositionManagersArgs>,
): PausableReadResult<PaginatedSpokeUserPositionManagerResult>;

export function useSpokeUserPositionManagers({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseSpokeUserPositionManagersArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<
  PaginatedSpokeUserPositionManagerResult,
  UnexpectedError,
  boolean
> {
  return useSuspendableQuery({
    document: SpokeUserPositionManagersQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}
