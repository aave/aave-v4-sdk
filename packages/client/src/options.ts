import { Currency, TimeWindow } from '@aave/graphql-next';

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

export const DEFAULT_QUERY_OPTIONS = {
  currency: Currency.Usd,
  timeWindow: TimeWindow.LastDay,
} as const;
