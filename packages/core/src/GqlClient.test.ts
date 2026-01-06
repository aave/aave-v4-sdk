import { assertErr, assertOk, ResultAsync } from '@aave/types';
import { gql, stringifyDocument } from '@urql/core';
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
} from 'vitest';
import type { Context } from './context';
import { GraphQLErrorCode } from './errors';
import { GqlClient } from './GqlClient';
import { createGraphQLErrorObject } from './testing';
import { delay } from './utils';

// see: https://mswjs.io/docs/graphql/mocking-responses/query-batching
function batched(url: string, handlers: Array<msw.RequestHandler>) {
  return msw.http.post(url, async ({ request }) => {
    const requestClone = request.clone();
    const payload = await request.clone().json();

    // Ignore non-batched GraphQL queries.
    if (!Array.isArray(payload)) {
      return;
    }

    const responses = await Promise.all(
      payload.map(async (query) => {
        // Construct an individual query request
        // to the same URL but with an unwrapped query body.
        const queryRequest = new Request(requestClone, {
          body: JSON.stringify(query),
        });

        // Resolve the individual query request
        // against the list of request handlers you provide.
        const response = await msw.getResponse(handlers, queryRequest);

        // Return the mocked response, if found.
        // Otherwise, perform the individual query as-is,
        // so it can be resolved against an original server.
        return response || fetch(msw.bypass(queryRequest));
      }),
    );

    // Read the mocked response JSON bodies to use
    // in the response to the entire batched query.
    const queryData = await Promise.all(
      responses.map((response) => response?.json()),
    );

    return msw.HttpResponse.json(queryData);
  });
}

export const TestQuery = gql`
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
  },
  headers: {},
  cache: null,
  debug: false,
  fragments: [],
};

const api = msw.graphql.link(context.environment.backend);

const server = setupServer(
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

describe(`Given an instance of the ${GqlClient.name}`, () => {
  let requests: Request[];

  beforeAll(() => {
    server.events.on('request:start', ({ request }) => {
      requests.push(request.clone());
    });

    server.listen();
  });

  beforeEach(() => {
    requests = [];
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

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

      const resul = await ResultAsync.combine([
        client.query(TestQuery, { id: 1 }),
        client.query(TestQuery, { id: 2 }),
        // on a separate tick, fire the third query
        ResultAsync.fromSafePromise(delay(1)).andThen(() =>
          client.query(TestQuery, { id: 3 }),
        ),
      ]);

      assertOk(resul);
      expect(requests).toHaveLength(2); // 2 HTTP requests were made
    });
  });

  describe('When executing a query that fails with GraphQL errors', () => {
    beforeAll(() => {
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
