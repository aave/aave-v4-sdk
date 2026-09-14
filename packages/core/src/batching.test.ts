import {
  createRequest,
  gql,
  makeOperation,
  type Operation,
  type OperationContext,
  type OperationResult,
} from '@urql/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filter,
  makeSubject,
  pipe,
  type Source,
  type Subscription,
  subscribe,
} from 'wonka';
import { batchFetchExchange } from './batching';
import { delay } from './utils';

const url = 'https://api.test/graphql';

const QueryA = gql`
  query A {
    a
  }
`;

const QueryB = gql`
  query B {
    b
  }
`;

function queryOperation(document: typeof QueryA): Operation {
  return makeOperation('query', createRequest(document, {}), {
    url,
    requestPolicy: 'cache-and-network',
  } as OperationContext);
}

function teardownOperation(operation: Operation): Operation {
  return makeOperation('teardown', operation, operation.context);
}

type PendingFetch = {
  body: unknown;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
};

describe(`Given the '${batchFetchExchange.name}' exchange`, () => {
  let pendingFetches: PendingFetch[];
  let results: OperationResult[];
  let next: (operation: Operation) => void;
  let subscription: Subscription;

  beforeEach(() => {
    pendingFetches = [];
    results = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: unknown, init?: RequestInit) =>
          new Promise<Response>((resolve, reject) => {
            pendingFetches.push({
              body: init?.body ? JSON.parse(init.body as string) : undefined,
              resolve,
              reject,
            });
          }),
      ),
    );

    const subject = makeSubject<Operation>();
    next = subject.next;

    const exchange = batchFetchExchange({
      batchInterval: 1,
      maxBatchSize: 10,
      url,
    });

    const io = exchange({
      forward: (ops$) =>
        pipe(
          ops$,
          filter(() => false),
        ) as unknown as Source<OperationResult>,
      client: {} as never,
      dispatchDebug: () => {},
    });

    subscription = pipe(
      io(subject.source),
      subscribe((result) => results.push(result)),
    );
  });

  afterEach(() => {
    subscription.unsubscribe();
    vi.unstubAllGlobals();
  });

  describe('When operations with the same key are dispatched within the same batch window', () => {
    it('Then the batch carries a single entry for that key and the response fans out to every subscriber', async () => {
      const opA = queryOperation(QueryA);

      next(opA);
      next(queryOperation(QueryA)); // same key, same window
      next(queryOperation(QueryB));
      await delay(10);

      expect(pendingFetches).toHaveLength(1);
      expect(pendingFetches[0]?.body).toHaveLength(2); // A once, B once

      pendingFetches[0]?.resolve(
        new Response(JSON.stringify([{ data: { a: 1 } }, { data: { b: 2 } }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
      await delay(10);

      expect(results.filter((r) => r.operation.key === opA.key)).toHaveLength(
        2,
      );
    });
  });

  describe('When an operation with the same key is dispatched while a batched request is in flight', () => {
    it('Then it coalesces onto the in-flight request instead of issuing a duplicate', async () => {
      const opA = queryOperation(QueryA);
      const opB = queryOperation(QueryB);

      next(opA);
      next(opB);
      await delay(10);
      expect(pendingFetches).toHaveLength(1);
      expect(pendingFetches[0]?.body).toHaveLength(2);

      // re-dispatch of A while the batch is in flight (e.g. urql-react
      // re-subscribing from its effect after the render-phase teardown)
      next(queryOperation(QueryA));
      await delay(10);
      expect(pendingFetches).toHaveLength(1);

      pendingFetches[0]?.resolve(
        new Response(JSON.stringify([{ data: { a: 1 } }, { data: { b: 2 } }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
      await delay(10);

      // A's response fans out to both subscribers; B's to its one
      expect(results.filter((r) => r.operation.key === opA.key)).toHaveLength(
        2,
      );
      expect(results.filter((r) => r.operation.key === opB.key)).toHaveLength(
        1,
      );
    });

    it('Then it issues a fresh request once the in-flight response has been delivered', async () => {
      next(queryOperation(QueryA));
      next(queryOperation(QueryB));
      await delay(10);
      expect(pendingFetches).toHaveLength(1);

      pendingFetches[0]?.resolve(
        new Response(JSON.stringify([{ data: { a: 1 } }, { data: { b: 2 } }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
      await delay(10);

      next(queryOperation(QueryA));
      await delay(10);
      expect(pendingFetches).toHaveLength(2);
    });

    it('Then it recovers and issues a fresh request after a network error', async () => {
      const opA = queryOperation(QueryA);

      next(opA);
      next(queryOperation(QueryB));
      await delay(10);
      next(queryOperation(QueryA)); // coalesced onto the failing request
      await delay(10);
      expect(pendingFetches).toHaveLength(1);

      pendingFetches[0]?.reject(new Error('connection reset'));
      await delay(10);

      const errored = results.filter((r) => r.operation.key === opA.key);
      expect(errored).toHaveLength(2);
      expect(errored[0]?.error?.networkError).toBeInstanceOf(Error);

      next(queryOperation(QueryA));
      await delay(10);
      expect(pendingFetches).toHaveLength(2);
    });
  });

  describe('When an operation with the same key is dispatched while a single-operation request is in flight', () => {
    it('Then it coalesces onto the in-flight request and both subscribers receive the response', async () => {
      const opA = queryOperation(QueryA);

      next(opA);
      await delay(10);
      expect(pendingFetches).toHaveLength(1);

      next(queryOperation(QueryA));
      await delay(10);
      expect(pendingFetches).toHaveLength(1);

      pendingFetches[0]?.resolve(
        new Response(JSON.stringify({ data: { a: 1 } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
      await delay(10);

      expect(results.filter((r) => r.operation.key === opA.key)).toHaveLength(
        2,
      );
    });

    it('Then it issues a fresh request after the in-flight request is torn down', async () => {
      const opA = queryOperation(QueryA);

      next(opA);
      await delay(10);
      expect(pendingFetches).toHaveLength(1);

      // aborts the in-flight single request, which must release its key
      next(teardownOperation(opA));
      await delay(10);

      next(queryOperation(QueryA));
      await delay(10);
      expect(pendingFetches).toHaveLength(2);
    });
  });
});
