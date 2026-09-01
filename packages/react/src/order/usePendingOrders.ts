import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '@aave/client';
import type { UnexpectedError } from '@aave/core';
import type {
  OrderFulfilled,
  OrderStatus,
  PaginatedOrdersResult,
  PendingOrdersRequest,
} from '@aave/graphql';
import { PendingOrdersQuery } from '@aave/graphql';
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
  refreshAfterLeverage,
  refreshAfterRepayWithSupply,
  refreshAfterSupplySwap,
  refreshAfterTokenSwap,
  refreshAfterWithdrawSwap,
} from '../helpers/cache';

import { isTerminalOrderStatus } from './helpers';

function findNewlyFulfilledOrders(
  items: readonly OrderStatus[],
  prevItems: readonly OrderStatus[],
): OrderFulfilled[] {
  const prevTypenames = new Map(
    prevItems.map((item) => [item.orderId, item.__typename]),
  );

  return items.filter(
    (item): item is OrderFulfilled =>
      item.__typename === 'OrderFulfilled' &&
      prevTypenames.get(item.orderId) !== 'OrderFulfilled',
  );
}

export type UsePendingOrdersArgs = Prettify<
  PendingOrdersRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Fetch the user's orders for a specific chain.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = usePendingOrders({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [OrderStatusFilter.Fulfilled, OrderStatusFilter.Open],
 *   suspense: true,
 * });
 * ```
 */
export function usePendingOrders(
  args: UsePendingOrdersArgs & Suspendable,
): SuspenseResult<PaginatedOrdersResult>;
/**
 * Fetch the user's orders for a specific chain.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = usePendingOrders({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [OrderStatusFilter.Fulfilled, OrderStatusFilter.Open],
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function usePendingOrders(
  args: Pausable<UsePendingOrdersArgs> & Suspendable,
): PausableSuspenseResult<PaginatedOrdersResult>;
/**
 * Fetch the user's orders for a specific chain.
 *
 * ```tsx
 * const { data, error, loading } = usePendingOrders({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [OrderStatusFilter.Fulfilled, OrderStatusFilter.Open],
 * });
 * ```
 */
export function usePendingOrders(
  args: UsePendingOrdersArgs,
): ReadResult<PaginatedOrdersResult>;
/**
 * Fetch the user's orders for a specific chain.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = usePendingOrders({
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc…'),
 *   filterBy: [OrderStatusFilter.Fulfilled, OrderStatusFilter.Open],
 *   pause: true,
 * });
 * ```
 */
export function usePendingOrders(
  args: Pausable<UsePendingOrdersArgs>,
): PausableReadResult<PaginatedOrdersResult>;

export function usePendingOrders({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UsePendingOrdersArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<PaginatedOrdersResult, UnexpectedError> {
  const client = useAaveClient();
  const [allTerminal, setAllTerminal] = useState(false);

  const result: SuspendableResult<PaginatedOrdersResult, UnexpectedError> =
    useSuspendableQuery({
      document: PendingOrdersQuery,
      variables: { request, currency, timeWindow },
      suspense,
      pause: pause || allTerminal,
      pollInterval: client.context.environment.swapStatusInterval,
    });

  const items = result.data?.items ?? [];
  const prevItems = useDeferredValue(items);

  useEffect(() => {
    if (items.length === 0) return;

    const allItemsTerminal = items.every(isTerminalOrderStatus);
    if (allItemsTerminal) {
      setAllTerminal(true);
    }

    for (const item of findNewlyFulfilledOrders(items, prevItems)) {
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

        case 'Leverage':
          if (request.user) {
            refreshAfterLeverage(client, request.user);
          }
          break;
      }
    }
  }, [items, prevItems, client, request.user]);

  return result;
}
