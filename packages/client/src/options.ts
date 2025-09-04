import { Currency } from '@aave/graphql-next';

export type QueryOptions = {
  /**
   * The currency for fiat amounts.
   *
   * @defaultValue {@link Currency.Usd}
   */
  currency: Currency;
};

export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  currency: Currency.Usd,
};
