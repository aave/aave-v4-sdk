import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type TimeWindowQueryOptions,
} from '@aave/client';
import type { UnexpectedError } from '@aave/core';
import type { SwapStatus, SwapStatusRequest } from '@aave/graphql';
import { SwapStatusQuery } from '@aave/graphql';
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

export type UseSwapStatusArgs = Prettify<
  SwapStatusRequest & CurrencyQueryOptions & TimeWindowQueryOptions
>;

/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Polls automatically until the swap reaches a terminal state (fulfilled, cancelled, or expired).
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useSwapStatus({
 *   id: swapReceipt.id,
 *   suspense: true,
 * });
 * ```
 */
export function useSwapStatus(
  args: UseSwapStatusArgs & Suspendable,
): SuspenseResult<SwapStatus>;
/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useSwapStatus({
 *   id: swapReceipt.id,
 *   suspense: true,
 *   pause: shouldPause,
 * });
 * ```
 */
export function useSwapStatus(
  args: Pausable<UseSwapStatusArgs> & Suspendable,
): PausableSuspenseResult<SwapStatus>;
/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Polls automatically until the swap reaches a terminal state (fulfilled, cancelled, or expired).
 *
 * ```tsx
 * const { data, error, loading } = useSwapStatus({
 *   id: swapReceipt.id,
 * });
 * ```
 */
export function useSwapStatus(args: UseSwapStatusArgs): ReadResult<SwapStatus>;
/**
 * Monitor the status of a single swap operation in real-time.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useSwapStatus({
 *   id: swapReceipt.id,
 *   pause: shouldPause,
 * });
 * ```
 */
export function useSwapStatus(
  args: Pausable<UseSwapStatusArgs>,
): PausableReadResult<SwapStatus>;

export function useSwapStatus({
  suspense = false,
  pause = false,
  currency = DEFAULT_QUERY_OPTIONS.currency,
  timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
  ...request
}: NullishDeep<UseSwapStatusArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<SwapStatus, UnexpectedError> {
  const client = useAaveClient();
  const [isTerminal, setIsTerminal] = useState(false);

  const result: SuspendableResult<SwapStatus, UnexpectedError> =
    useSuspendableQuery({
      document: SwapStatusQuery,
      variables: { request, currency, timeWindow },
      suspense,
      pause: pause || isTerminal,
      pollInterval: client.context.environment.swapStatusInterval,
    });

  useEffect(() => {
    if (result.data && isTerminalSwapStatus(result.data)) {
      setIsTerminal(true);
    }
  }, [result.data]);

  return result;
}
