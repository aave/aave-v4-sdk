import { Currency, TimeWindow } from '@aave/graphql-next';
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

export type RequestPolicyOptions = {
  /**
   * The request policy to use.
   *
   * @internal This is used for testing purposes and could be changed without notice.
   * @defaultValue `cache-and-network`
   */
  requestPolicy?: RequestPolicy;
};

export const DEFAULT_QUERY_OPTIONS = {
  currency: Currency.Usd,
  timeWindow: TimeWindow.LastDay,
  requestPolicy: 'cache-and-network',
} as const;
