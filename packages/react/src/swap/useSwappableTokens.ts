import type { UnexpectedError } from '@aave/core';
import type { Token } from '@aave/graphql';
import {
  SwappableTokensQuery,
  type SwappableTokensRequest,
} from '@aave/graphql';
import type { NullishDeep } from '@aave/types';

import {
  type Pausable,
  type PausableReadResult,
  type PausableSuspenseResult,
  type ReadResult,
  type Suspendable,
  type SuspendableResult,
  type SuspenseResult,
  useSuspendableQuery,
} from '../helpers';

export type UseSwappableTokensArgs = SwappableTokensRequest;

/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs & Suspendable,
): SuspenseResult<Token[]>;
/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: Pausable<UseSwappableTokensArgs> & Suspendable,
): PausableSuspenseResult<Token[]>;
/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 * });
 * ```
 */
export function useSwappableTokens(
  args: UseSwappableTokensArgs,
): ReadResult<Token[]>;
/**
 * Fetch the list of tokens available for swapping on a specific chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSwappableTokens({
 *   query: { chainIds: [chainId(1)] },
 *   pause: true,
 * });
 * ```
 */
export function useSwappableTokens(
  args: Pausable<UseSwappableTokensArgs>,
): PausableReadResult<Token[]>;

export function useSwappableTokens({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseSwappableTokensArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<Token[], UnexpectedError> {
  return useSuspendableQuery({
    document: SwappableTokensQuery,
    variables: {
      request,
    },
    suspense,
    pause,
  });
}
