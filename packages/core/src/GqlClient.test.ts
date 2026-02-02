import { assertErr, assertOk, ResultAsync } from '@aave/types';
import { gql, stringifyDocument } from '@urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Subscription } from 'wonka';
import type { Context } from './context';
import { GraphQLErrorCode } from './errors';
import { GqlClient } from './GqlClient';
import { batched } from './msw';
import { createGraphQLErrorObject } from './testing';
import { delay } from './utils';

const TestQuery = gql`
  query TestQuery($id: Int!) {
    value(id: $id)
  }
`;

const context: Context = {
  displayName: 'GqlClient',
  environment: {
    name: 'test',
    backend: 'https://api.aave.com',
    indexingTimeout: 1000,
    pollingInterval: 1000,
    swapQuoteInterval: 1000,
    swapStatusInterval: 1000,
  },
  headers: {},
  cache: cacheExchange(),
  debug: false,
  fragments: [],
};

const api = msw.graphql.link(context.environment.backend);

const server = setupServer();

describe(`Given an instance of the ${GqlClient.name}`, () => {
  let requests: Request[] = [];

  beforeAll(() => {
    server.events.on('request:start', ({ request }) => {
      requests.push(request.clone());
    });

    server.listen();
  });

  beforeEach(() => {
    server.use(
      batched(context.environment.backend, [
        api.query(TestQuery, ({ variables }) =>
          msw.HttpResponse.json({
            data: {
              value: variables.id,
            },
          }),
        ),
      ]),
      api.query(TestQuery, ({ variables }) =>
        msw.HttpResponse.json({
          data: {
            value: variables.id,
          },
        }),
      ),
    );
    requests = [];
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('And an active query', () => {
    describe('When the query is marked for refresh', () => {
      let subscription: Subscription;
      const client = new GqlClient(context);

      beforeEach(async () => {
        subscription = client.urql
          .query(TestQuery, { id: 1 })
          .subscribe(() => {});

        await vi.waitUntil(() => requests.length === 1, { timeout: 1000 });
      });

      it('Then it should refetch the query automatically', async () => {
        await client.refreshQueryWhere(TestQuery, () => true);

        await vi.waitFor(
          () => {
            expect(requests).toHaveLength(2);
          },
          { timeout: 1000 },
        );

        subscription.unsubscribe();
      });
    });
  });

  describe('And a query that was executed and cached, then marked for refresh', () => {
    describe('When refetching the same query', () => {
      it('Then it should always refetch the query from the network', async () => {
        const client = new GqlClient(context);
        const setup = await client.query(TestQuery, { id: 1 });
        assertOk(setup);

        await client.refreshQueryWhere(TestQuery, () => true);

        const result = await client.query(
          TestQuery,
          { id: 1 },
          { requestPolicy: 'cache-first' },
        );
        assertOk(result);

        expect(requests).toHaveLength(2); // 2 HTTP requests were made
      });

      it('Then it should also refetch in case the original query was initially part of a GQL batch request', async () => {
        const client = new GqlClient(context);
        const resul = await ResultAsync.combine([
          client.query(TestQuery, { id: 1 }),
          client.query(TestQuery, { id: 2 }),
        ]);
        assertOk(resul);

        await client.refreshQueryWhere(
          TestQuery,
          (variables) => variables.id === 1,
        );

        const result = await client.query(
          TestQuery,
          { id: 1 },
          { requestPolicy: 'cache-first' },
        );
        assertOk(result);
        expect(await requests[1]!.json()).toEqual({
          operationName: 'TestQuery',
          query: stringifyDocument(TestQuery),
          variables: { id: 1 },
        });
      });
    });
  });

  describe('And observing the requests made by the client', () => {
    describe('When executing a single isolated query', () => {
      it('Then it should execute it in its own HTTP request', async () => {
        const client = new GqlClient(context);

        const result = await client.query(TestQuery, { id: 1 });

        assertOk(result);
        expect(await requests[0]!.json()).toEqual({
          operationName: 'TestQuery',
          query: stringifyDocument(TestQuery),
          variables: { id: 1 },
        });
      });
    });

    describe('When executing concurrent queries', () => {
      it('Then it should batch queries fired in the same event-loop tick into a single HTTP request', async () => {
        const client = new GqlClient(context);

        const result = await ResultAsync.combine([
          client.query(TestQuery, { id: 1 }),
          client.query(TestQuery, { id: 2 }),
          // on a separate tick, fire the third query
          ResultAsync.fromSafePromise(delay(1)).andThen(() =>
            client.query(TestQuery, { id: 3 }),
          ),
        ]);

        assertOk(result);
        expect(requests).toHaveLength(2); // 2 HTTP requests were made
      });
    });

    describe('When executing a query that fails with GraphQL errors', () => {
      beforeEach(() => {
        server.use(
          api.query(TestQuery, () => {
            return msw.HttpResponse.json({
              errors: [createGraphQLErrorObject(GraphQLErrorCode.BAD_REQUEST)],
            });
          }),
        );
      });

      it('Then it should fail with an `UnexpectedError`', async () => {
        const client = new GqlClient(context);

        const result = await client.query(TestQuery, { id: 1 });

        assertErr(result);
      });
    });

    describe('When batching concurrent queries', () => {
      it('Then it should limit batching to a maximum of 10 queries', async () => {
        const client = new GqlClient(context);

        const result = await ResultAsync.combine(
          Array.from({ length: 15 }, (_, i) =>
            client.query(TestQuery, { id: String(i + 1) }),
          ),
        );

        assertOk(result);
        expect(requests).toHaveLength(2); // 2 HTTP requests were made
      });

      it('Then it should allow single queries to skip the batching', async () => {
        const client = new GqlClient(context);

        const result = await ResultAsync.combine([
          client.query(TestQuery, { id: 1 }),
          client.query(TestQuery, { id: 2 }),
          client.query(TestQuery, { id: 3 }, { batch: false }),
        ]);

        assertOk(result);
        expect(requests).toHaveLength(2); // 2 HTTP requests were made (one batched, one not)
      });
    });
  });
});
