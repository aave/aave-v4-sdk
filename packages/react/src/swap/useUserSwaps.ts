import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '@aave/client';
import type { UnexpectedError } from '@aave/core';
import type {
  PaginatedUserSwapsResult,
  SwapFulfilled,
  SwapStatus,
  UserSwapsRequest,
} from '@aave/graphql';
import { UserSwapsQuery } from '@aave/graphql';
import type { NullishDeep, Prettify } from '@aave/types';
import { useDeferredValue, useEffect, useState } from 'react';

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

import {
  refreshAfterBorrowSwap,
  refreshAfterRepayWithSupply,
  refreshAfterSupplySwap,
  refreshAfterTokenSwap,
  refreshAfterWithdrawSwap,
} from '../helpers/cache';

import { isTerminalSwapStatus } from './helpers';

function findNewlyFulfilledSwaps(
  items: readonly SwapStatus[],
  prevItems: readonly SwapStatus[],
): SwapFulfilled[] {
  const prevTypenames = new Map(
    prevItems.map((item) => [item.swapId, item.__typename]),
  );

  return items.filter(
    (item): item is SwapFulfilled =>
      item.__typename === 'SwapFulfilled' &&
      prevTypenames.get(item.swapId) !== 'SwapFulfilled',
  );
}

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

  const items = result.data?.items ?? [];
  const prevItems = useDeferredValue(items);

  useEffect(() => {
    if (items.length === 0) return;

    const allItemsTerminal = items.every(isTerminalSwapStatus);
    if (allItemsTerminal) {
      setAllTerminal(true);
    }

    for (const item of findNewlyFulfilledSwaps(items, prevItems)) {
      switch (item.operation.__typename) {
        case 'TokenSwap':
          if (request.user) {
            refreshAfterTokenSwap(client, request.user);
          }
          break;

        case 'BorrowSwap':
          if (request.user) {
            refreshAfterBorrowSwap(client, request.user);
          }
          break;

        case 'RepayWithSupply':
          if (request.user) {
            refreshAfterRepayWithSupply(client, request.user);
          }
          break;

        case 'SupplySwap':
          if (request.user) {
            refreshAfterSupplySwap(client, request.user);
          }
          break;

        case 'WithdrawSwap':
          if (request.user) {
            refreshAfterWithdrawSwap(client, request.user);
          }
          break;
      }
    }
  }, [items, prevItems, client, request.user]);

  return result;
}
