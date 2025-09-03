import { type Chain, ChainsFilter, ChainsQuery } from '@aave/graphql-next';
import {
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from './helpers';

export type UseChainsArgs = {
  filter?: ChainsFilter;
};
/**
 * Fetch supported blockchain chains.
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
export function useChains(
  args: UseChainsArgs & Suspendable,
): SuspenseResult<Chain[]>;

/**
 * Fetch supported blockchain chains.
 *
 * ```tsx
 * const { data, error, loading } = useChains({
 *   filter: 'MAINNET_ONLY',
 * });
 * ```
 */
export function useChains(args: UseChainsArgs): ReadResult<Chain[]>;

export function useChains({
  suspense = false,
  filter = ChainsFilter.ALL,
}: UseChainsArgs & {
  suspense?: boolean;
}): SuspendableResult<Chain[]> {
  return useSuspendableQuery({
    document: ChainsQuery,
    variables: { filter },
    suspense,
  });
}
