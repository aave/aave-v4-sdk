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
import {
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
 * ```tsx
 * const { data, error, loading } = useSpokes({
 *     chainIds: [chainId(1)],
 *   },
 * });
 * ```
 */
export function useSpokes(args: UseSpokesArgs): ReadResult<Spoke[]>;

export function useSpokes({
  suspense = false,
  ...request
}: UseSpokesArgs & {
  suspense?: boolean;
}): SuspendableResult<Spoke[]> {
  return useSuspendableQuery({
    document: SpokesQuery,
    variables: {
      request,
    },
    suspense,
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

export function useSpokePositionManagers({
  suspense = false,
  ...request
}: UseSpokePositionManagersArgs & {
  suspense?: boolean;
}): SuspendableResult<PaginatedSpokePositionManagerResult> {
  return useSuspendableQuery({
    document: SpokePositionManagersQuery,
    variables: {
      request,
    },
    suspense,
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

export function useSpokeUserPositionManagers({
  suspense = false,
  ...request
}: UseSpokeUserPositionManagersArgs & {
  suspense?: boolean;
}): SuspendableResult<PaginatedSpokeUserPositionManagerResult> {
  return useSuspendableQuery({
    document: SpokeUserPositionManagersQuery,
    variables: {
      request,
    },
    suspense,
  });
}
