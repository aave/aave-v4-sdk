import { Currency, TimeWindow } from '@aave/graphql-next';

export type QueryOptions = {
  /**
   * The currency for fiat amounts.
   *
   * @defaultValue {@link Currency.Usd}
   */
  currency: Currency;
  /**
   * The time window for historical data changes.
   *
   * @defaultValue {@link TimeWindow.LastDay}
   */
  timeWindow: TimeWindow;
};

export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  currency: Currency.Usd,
  timeWindow: TimeWindow.LastDay,
};
