import {
  createRequest,
  gql,
  makeOperation,
  type Operation,
  type OperationContext,
  type OperationResult,
} from '@urql/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  makeSubject,
  pipe,
  type Source,
  type Subscription,
  subscribe,
} from 'wonka';
import { inFlightDedupExchange, refetching } from './dedup';

const QueryA = gql`
  query A {
    a
  }
`;

const MutationM = gql`
  mutation M {
    m
  }
`;

function queryOperation(
  extraContext: Partial<OperationContext> = {},
): Operation {
  return makeOperation('query', createRequest(QueryA, {}), {
    url: 'https://api.test/graphql',
    requestPolicy: 'cache-and-network',
    ...extraContext,
  } as OperationContext);
}

function resultFor(operation: Operation): OperationResult {
  return {
    operation,
    data: { value: 42 },
    error: undefined,
    extensions: undefined,
    stale: false,
    hasNext: false,
  };
}

describe(`Given the '${inFlightDedupExchange.name}' exchange`, () => {
  let forwardedOps: Operation[];
  let emitResult: (result: OperationResult) => void;
  let next: (operation: Operation) => void;
  let subscription: Subscription;

  beforeEach(() => {
    forwardedOps = [];

    const opsSubject = makeSubject<Operation>();
    const resultsSubject = makeSubject<OperationResult>();
    next = opsSubject.next;
    emitResult = resultsSubject.next;

    const io = inFlightDedupExchange()({
      forward: (ops$) => {
        pipe(
          ops$,
          subscribe((op) => forwardedOps.push(op)),
        );
        return resultsSubject.source as Source<OperationResult>;
      },
      client: {} as never,
      dispatchDebug: () => {},
    });

    subscription = pipe(
      io(opsSubject.source),
      subscribe(() => {}),
    );
  });

  afterEach(() => {
    subscription.unsubscribe();
  });

  describe('When a query is dispatched while the same key is in flight', () => {
    it('Then it drops the duplicate', () => {
      next(queryOperation());
      next(queryOperation());

      expect(forwardedOps).toHaveLength(1);
    });

    it('Then it forwards again once a result has arrived', () => {
      const op = queryOperation();
      next(op);
      emitResult(resultFor(op));
      next(queryOperation());

      expect(forwardedOps).toHaveLength(2);
    });

    it('Then it forwards again after a teardown, which aborts the in-flight request', () => {
      const op = queryOperation();
      next(op);
      next(makeOperation('teardown', op, op.context));
      next(queryOperation());

      expect(
        forwardedOps.filter((forwarded) => forwarded.kind === 'query'),
      ).toHaveLength(2);
    });
  });

  describe('When a deliberate refresh is dispatched while the same key is in flight', () => {
    it('Then it always forwards it', () => {
      next(queryOperation());
      next(queryOperation({ [refetching]: true } as never));

      expect(forwardedOps).toHaveLength(2);
    });

    it('Then later duplicates coalesce onto the refresh', () => {
      const op = queryOperation();
      next(op);
      emitResult(resultFor(op));

      next(queryOperation({ [refetching]: true } as never));
      next(queryOperation());

      expect(forwardedOps).toHaveLength(2);
    });
  });

  describe('When non-query operations are dispatched', () => {
    it('Then it always forwards mutations and teardowns', () => {
      const mutation = makeOperation('mutation', createRequest(MutationM, {}), {
        url: 'https://api.test/graphql',
        requestPolicy: 'network-only',
      } as OperationContext);

      next(mutation);
      next(mutation);
      const query = queryOperation();
      next(query);
      next(makeOperation('teardown', query, query.context));

      expect(forwardedOps).toHaveLength(4);
    });
  });
});
