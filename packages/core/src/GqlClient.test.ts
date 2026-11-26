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
  ssr: null,
  batch: true,
  debug: false,
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

    describe('When the query is marked for refresh but the subscriber unsubscribes before the refetch completes (e.g., useQuery unmounts)', () => {
      const client = new GqlClient(context);

      it('Then it should mark the query as stale so the next read skips the cache', async () => {
        let received = false;
        const subscription = client.urql
          .query(TestQuery, { id: 1 })
          .subscribe(() => {
            received = true;
          });
        await vi.waitUntil(() => received, { timeout: 1000 });

        await client.refreshQueryWhere(TestQuery, () => true);
        subscription.unsubscribe();

        const result = await client.query(
          TestQuery,
          { id: 1 },
          { requestPolicy: 'cache-first' }, // gets ignored because the query is stale
        );
        assertOk(result);

        // 3 HTTP requests: initial query + refetch from reexecuteOperation + stale re-query
        expect(requests).toHaveLength(3);
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

  describe('And a cached list whose items are written by other queries', () => {
    const ItemsQuery = gql`
      query ItemsQuery {
        value: items {
          id
          name
        }
      }
    `;
    const ItemQuery = gql`
      query ItemQuery {
        value: item {
          id
          name
        }
      }
    `;
    const item = (id: string, name: string) => ({
      __typename: 'Item',
      id,
      name,
    });

    describe('When a network-only query for the list is in flight while those writes land', () => {
      it('Then it should resolve with the network response, not the cache re-read', async () => {
        let listRequests = 0;
        let writes = 0;
        server.use(
          api.query(ItemsQuery, async () => {
            listRequests++;
            if (listRequests === 1) {
              return msw.HttpResponse.json({
                data: { value: [item('1', 'old')] },
              });
            }
            await delay(100);
            return msw.HttpResponse.json({
              data: { value: [item('2', 'new')] },
            });
          }),
          api.query(ItemQuery, () => {
            writes++;
            return msw.HttpResponse.json({
              data: { value: item('1', `old, write ${writes}`) },
            });
          }),
        );
        const client = new GqlClient({ ...context, batch: false });
        assertOk(
          await client.query(
            ItemsQuery,
            {},
            { requestPolicy: 'cache-first', batch: false },
          ),
        );

        const fresh = client.query(
          ItemsQuery,
          {},
          { requestPolicy: 'network-only', batch: false },
        );
        // urql drops the first cache re-read while the list is in flight, not the second
        await client.query(
          ItemQuery,
          {},
          { requestPolicy: 'network-only', batch: false },
        );
        await client.query(
          ItemQuery,
          {},
          { requestPolicy: 'network-only', batch: false },
        );

        const result = await fresh;
        assertOk(result);
        expect(result.value).toEqual([{ id: '2', name: 'new' }]);
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

    describe('When a cache-first query and a network-only query fire in the same batching window', () => {
      const OtherQuery = gql`
        query OtherQuery($id: Int!) {
          value(id: $id)
        }
      `;

      const client = new GqlClient(context);

      beforeEach(async () => {
        server.use(
          api.query(OtherQuery, ({ variables }) =>
            msw.HttpResponse.json({
              data: {
                value: variables.id,
              },
            }),
          ),
        );

        // Prime the cache with TestQuery { id: 1 }
        const setup = await client.query(TestQuery, { id: 1 });
        assertOk(setup);
        expect(requests).toHaveLength(1);
      });

      it('Then only the network-only query should appear in the HTTP request', async () => {
        const result = await ResultAsync.combine([
          client.query(TestQuery, { id: 1 }, { requestPolicy: 'cache-first' }),
          client.query(
            OtherQuery,
            { id: 2 },
            { requestPolicy: 'network-only' },
          ),
        ]);

        assertOk(result);
        // Only 2 HTTP requests total: the initial setup + the network-only OtherQuery
        expect(requests).toHaveLength(2);

        // The second request should be the OtherQuery only (not batched with cache-only)
        expect(await requests[1]!.json()).toEqual({
          operationName: 'OtherQuery',
          query: stringifyDocument(OtherQuery),
          variables: { id: 2 },
        });
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
