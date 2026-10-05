import type { UnexpectedError } from '@aave/client';
import {
  type LiquidationsSummary,
  LiquidationsSummaryQuery,
  type LiquidationsSummaryRequest,
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

export type UseLiquidationsSummaryArgs = LiquidationsSummaryRequest;

/**
 * Fetch liquidation totals and a time series for a spoke or a reserve.
 *
 * This signature supports React Suspense:
 *
 * ```tsx
 * const { data } = useLiquidationsSummary({
 *   query: { spokeId: spokeId('SGVsbG8h') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastMonth,
 *   suspense: true,
 * });
 * ```
 */
export function useLiquidationsSummary(
  args: UseLiquidationsSummaryArgs & Suspendable,
): SuspenseResult<LiquidationsSummary | null>;
/**
 * Fetch liquidation totals and a time series for a spoke or a reserve.
 *
 * Pausable suspense mode.
 *
 * ```tsx
 * const { data } = useLiquidationsSummary({
 *   query: { spokeId: spokeId('SGVsbG8h') },
 *   suspense: true,
 *   pause: true,
 * });
 * ```
 */
export function useLiquidationsSummary(
  args: Pausable<UseLiquidationsSummaryArgs> & Suspendable,
): PausableSuspenseResult<LiquidationsSummary | null>;
/**
 * Fetch liquidation totals and a time series for a spoke or a reserve.
 *
 * ```tsx
 * const { data, error, loading } = useLiquidationsSummary({
 *   query: { reserveId: reserveId('SGVsbG8h') },
 *   currency: Currency.Usd,
 *   window: TimeWindow.LastMonth,
 * });
 * ```
 */
export function useLiquidationsSummary(
  args: UseLiquidationsSummaryArgs,
): ReadResult<LiquidationsSummary | null>;
/**
 * Fetch liquidation totals and a time series for a spoke or a reserve.
 *
 * Pausable loading state mode.
 *
 * ```tsx
 * const { data, error, loading, paused } = useLiquidationsSummary({
 *   query: { spokeId: spokeId('SGVsbG8h') },
 *   pause: true,
 * });
 * ```
 */
export function useLiquidationsSummary(
  args: Pausable<UseLiquidationsSummaryArgs>,
): PausableReadResult<LiquidationsSummary | null>;

export function useLiquidationsSummary({
  suspense = false,
  pause = false,
  ...request
}: NullishDeep<UseLiquidationsSummaryArgs> & {
  suspense?: boolean;
  pause?: boolean;
}): SuspendableResult<LiquidationsSummary | null, UnexpectedError> {
  return useSuspendableQuery({
    document: LiquidationsSummaryQuery,
    variables: {
      request,
    },
    suspense,
    pause,
    batch: false, // aggregates over the whole window, slower than an average query
  });
}
