import { type Chain, ChainsFilter, ChainsQuery } from '@aave/graphql-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseAaveChainsArgs = {
  filter?: ChainsFilter;
};
/**
 * Fetches the list of supported chains.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useAaveChains({
 *   filter: 'ALL',
 *   suspense: true,
 * });
 * ```
 */
export function useAaveChains(
  args: UseAaveChainsArgs & Suspendable,
): SuspenseResult<Chain[]>;

/**
 * Fetches the list of supported chains.
 *
 * ```tsx
 * const { data, error, loading } = useAaveChains({
 *   filter: 'MAINNET_ONLY',
 * });
 * ```
 */
export function useAaveChains(args: UseAaveChainsArgs): ReadResult<Chain[]>;

export function useAaveChains({
  suspense = false,
  filter = ChainsFilter.ALL,
}: UseAaveChainsArgs & {
  suspense?: boolean;
}): SuspendableResult<Chain[]> {
  return useSuspendableQuery({
    document: ChainsQuery,
    variables: { filter },
    suspense,
  });
}
