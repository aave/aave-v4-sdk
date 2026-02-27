import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '@aave/client';
import type { UnexpectedError } from '@aave/core';
import type { PaginatedUserSwapsResult, UserSwapsRequest } from '@aave/graphql';
import { UserSwapsQuery } from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';
import { useEffect, useState } from 'react';

import { useAaveClient } from '../context';
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

import { isTerminalSwapStatus } from './helpers';

export type UseUserSwapsArgs = Prettify<
  UserSwapsRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch the user's swap history for a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   suspense: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: UseUserSwapsArgs & Suspendable,
): SuspenseResult<PaginatedUserSwapsResult>;
/**
 * Fetch the user's swap history for a specific chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: Pausable<UseUserSwapsArgs> & Suspendable,
): PausableSuspenseResult<PaginatedUserSwapsResult>;
/**
 * Fetch the user's swap history for a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 * });
 * ```
 */
export function useUserSwaps(
  args: UseUserSwapsArgs,
): ReadResult<PaginatedUserSwapsResult>;
/**
 * Fetch the user's swap history for a specific chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useUserSwaps({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [SwapStatusFilter.FULFILLED, SwapStatusFilter.OPEN],
 *   pause: true,
 * });
 * ```
 */
export function useUserSwaps(
  args: Pausable<UseUserSwapsArgs>,
): PausableReadResult<PaginatedUserSwapsResult>;

export function useUserSwaps({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseUserSwapsArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedUserSwapsResult, UnexpectedError> {
  const client = useAaveClient();
  const [allTerminal, setAllTerminal] = useState(false);

  const result: SuspendableResult<PaginatedUserSwapsResult, UnexpectedError> =
    useSuspendableQuery({
      document: UserSwapsQuery,
      variables: { request, currency, timeWindow },
      suspense,
      pause: pause || allTerminal,
      pollInterval: client.context.environment.swapStatusInterval,
    });

  useEffect(() => {
    if (result.data && result.data.items.length > 0) {
      const allItemsTerminal = result.data.items.every(isTerminalSwapStatus);
      if (allItemsTerminal) {
        setAllTerminal(true);
      }
    }
  }, [result.data]);

  return result;
}
