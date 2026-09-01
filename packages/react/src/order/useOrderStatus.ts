import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '@aave/client';
import type { UnexpectedError } from '@aave/core';
import type { OrderId, OrderStatus, OrderStatusRequest } from '@aave/graphql';
import { OrderStatusQuery } from '@aave/graphql';
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

import { isTerminalOrderStatus } from './helpers';

export type UseOrderStatusArgs = Prettify<
  OrderStatusRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Monitor the status of a single order in real-time.
 *
 * Polls automatically until the order reaches a terminal state (fulfilled, cancelled, or expired).
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useOrderStatus({
 *   id: orderReceipt.orderId,
 *   suspense: true,
 * });
 * ```
 */
export function useOrderStatus(
  args: UseOrderStatusArgs & Suspendable,
): SuspenseResult<OrderStatus>;
/**
 * Monitor the status of a single order in real-time.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useOrderStatus({
 *   id: orderReceipt.orderId,
 *   suspense: true,
 *   pause: shouldPause,
 * });
 * ```
 */
export function useOrderStatus(
  args: Pausable<UseOrderStatusArgs> & Suspendable,
): PausableSuspenseResult<OrderStatus>;
/**
 * Monitor the status of a single order in real-time.
 *
 * Polls automatically until the order reaches a terminal state (fulfilled, cancelled, or expired).
 *
 * ```tsx
 * const { data, error, loading } = useOrderStatus({
 *   id: orderReceipt.orderId,
 * });
 * ```
 */
export function useOrderStatus(
  args: UseOrderStatusArgs,
): ReadResult<OrderStatus>;
/**
 * Monitor the status of a single order in real-time.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useOrderStatus({
 *   id: orderReceipt.orderId,
 *   pause: shouldPause,
 * });
 * ```
 */
export function useOrderStatus(
  args: Pausable<UseOrderStatusArgs>,
): PausableReadResult<OrderStatus>;

export function useOrderStatus({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseOrderStatusArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<OrderStatus, UnexpectedError> {
  const client = useAaveClient();
  // The id of the order observed in a terminal state, so polling stops for
  // that order but resumes when the hook is pointed at a different one.
  const [terminalOrderId, setTerminalOrderId] = useState<OrderId | null>(null);

  const result: SuspendableResult<OrderStatus, UnexpectedError> =
    useSuspendableQuery({
      document: OrderStatusQuery,
      variables: { request, currency, timeWindow },
      suspense,
      pause:
        pause || (terminalOrderId !== null && terminalOrderId === request.id),
      pollInterval: client.context.environment.swapStatusInterval,
    });

  useEffect(() => {
    if (result.data && isTerminalOrderStatus(result.data)) {
      setTerminalOrderId(result.data.orderId);
    }
  }, [result.data]);

  return result;
}
