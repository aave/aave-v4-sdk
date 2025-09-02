import { graphql, type RequestOf } from '../graphql';

/**
 * @internal
 */
export const HasProcessedKnownTransactionQuery = graphql(
  `query HasProcessedKnownTransaction($request: HasProcessedKnownTransactionRequest!) {
    value: hasProcessedKnownTransaction(request: $request)
  }`,
);
export type HasProcessedKnownTransactionRequest = RequestOf<typeof HasProcessedKnownTransactionQuery>;
