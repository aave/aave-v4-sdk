import { ChainFragment } from './fragments';
import { graphql, type RequestOf } from './graphql';

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
