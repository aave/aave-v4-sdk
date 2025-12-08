import { Currency, TimeWindow } from '@aave/graphql';
import type { RequestPolicy } from '@urql/core';

export type CurrencyQueryOptions = {
  /**
   * The currency for fiat amounts.
   *
   * @defaultValue {@link Currency.Usd}
   */
  currency?: Currency;
};

export type TimeWindowQueryOptions = {
  /**
   * The time window for historical data changes.
   *
   * @defaultValue {@link TimeWindow.LastDay}
   */
  timeWindow?: TimeWindow;
};

/**
 * @internal
 */
export type RequestPolicyOptions = {
  /**
   * The request policy to use.
   *
   * @internal This is used for testing purposes and could be changed without notice.
   * @defaultValue `cache-and-network`
   */
  requestPolicy?: RequestPolicy;
};

/**
 * @internal
 */
export type BatchOptions = {
  /**
   * Whether to batch the query or not.
   *
   * @internal This is used to turn off batching for a single query.
   * @defaultValue `true`
   */
  batch?: boolean;
};

export const DEFAULT_QUERY_OPTIONS = {
  currency: Currency.Usd,
  timeWindow: TimeWindow.LastDay,
  requestPolicy: 'cache-and-network',
  batch: true,
} as const;
