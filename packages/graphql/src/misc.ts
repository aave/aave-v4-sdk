import { ChainFragment, ExchangeAmountFragment } from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const ChainQuery = graphql(
  `query Chain($request: ChainRequest!) {
    value: chain(request: $request) {
      ...Chain
    }
  }`,
  [ChainFragment],
);
export type ChainRequest = RequestOf<typeof ChainQuery>;

/**
 * @internal
 */
export const ChainsQuery = graphql(
  `query Chains($filter: ChainsFilter!) {
    value: chains(filter: $filter) {
      ...Chain
    }
  }`,
  [ChainFragment],
);

/**
 * @internal
 */
export const HasProcessedKnownTransactionQuery = graphql(
  `query HasProcessedKnownTransaction($request: HasProcessedKnownTransactionRequest!) {
    value: hasProcessedKnownTransaction(request: $request)
  }`,
);
export type HasProcessedKnownTransactionRequest = RequestOf<
  typeof HasProcessedKnownTransactionQuery
>;

/**
 * @internal
 */
export const HealthQuery = graphql(
  `query Health {
    value: health
  }`,
);

/**
 * @internal
 */
export const ExchangeRateQuery = graphql(
  `query ExchangeRate($request: ExchangeRateRequest!) {
    value: exchangeRate(request: $request) {
      ...ExchangeAmount
    }
  }`,
  [ExchangeAmountFragment],
);
export type ExchangeRateRequest = RequestOf<typeof ExchangeRateQuery>;

export type ExchangeRateRequestFrom = ReturnType<
  typeof graphql.scalar<'ExchangeRateRequestFrom'>
>;
