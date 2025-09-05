import {
  SpokesQuery,
  SpokesRequest,
} from '@aave/graphql-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';
import { Spoke } from '@aave/graphql-next';

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
