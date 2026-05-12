import { assertOk } from '@aave/types';
import { gql, ssrExchange } from '@urql/core';
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
} from 'vitest';
import type { Context } from './context';
import { GqlClient } from './GqlClient';
import { batched } from './msw';

const TestQuery = gql`
  query TestQuery($id: Int!) {
    value(id: $id)
  }
`;

const environment = {
  name: 'test',
  backend: 'https://api.aave.com',
  indexingTimeout: 1000,
  pollingInterval: 1000,
  swapQuoteInterval: 1000,
  swapStatusInterval: 1000,
};

const api = msw.graphql.link(environment.backend);
const server = setupServer();

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    displayName: 'GqlClient',
    environment,
    headers: {},
    cache: cacheExchange(),
    ssr: null,
    batch: true,
    debug: false,
    ...overrides,
  };
}

describe(`Given a ${GqlClient.name} configured for SSR hand-off`, () => {
  let requests: Request[] = [];

  beforeAll(() => {
    server.events.on('request:start', ({ request }) => {
      requests.push(request.clone());
    });
    server.listen();
  });

  beforeEach(() => {
    server.use(
      batched(environment.backend, [
        api.query(TestQuery, ({ variables }) =>
          msw.HttpResponse.json({ data: { value: variables.id } }),
        ),
      ]),
      api.query(TestQuery, ({ variables }) =>
        msw.HttpResponse.json({ data: { value: variables.id } }),
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

  describe('When data is fetched on the server and rehydrated on the client', () => {
    it('Then the client should resolve the same query without an extra network request', async () => {
      const serverClient = new GqlClient(
        makeContext({ ssr: ssrExchange({ isClient: false }) }),
      );

      const serverResult = await serverClient.query(TestQuery, { id: 1 });
      assertOk(serverResult);
      expect(requests).toHaveLength(1);

      const initialState = serverClient.extractData();
      expect(Object.keys(initialState)).toHaveLength(1);

      const clientClient = new GqlClient(
        makeContext({ ssr: ssrExchange({ isClient: true, initialState }) }),
      );

      const clientResult = await clientClient.query(TestQuery, { id: 1 });
      assertOk(clientResult);

      // Still only the initial server-side request — the client read from the SSR snapshot.
      expect(requests).toHaveLength(1);
    });
  });

  describe('When `restoreData` is called after construction', () => {
    it('Then it should hydrate subsequent reads from the snapshot', async () => {
      const serverClient = new GqlClient(
        makeContext({ ssr: ssrExchange({ isClient: false }) }),
      );
      const serverResult = await serverClient.query(TestQuery, { id: 7 });
      assertOk(serverResult);
      expect(requests).toHaveLength(1);

      const clientClient = new GqlClient(
        makeContext({ ssr: ssrExchange({ isClient: true }) }),
      );
      clientClient.restoreData(serverClient.extractData());

      const clientResult = await clientClient.query(TestQuery, { id: 7 });
      assertOk(clientResult);
      expect(requests).toHaveLength(1);
    });
  });

  describe('When `extractData` is called without `ssr` configured', () => {
    it('Then it should throw a clear invariant error', () => {
      const client = new GqlClient(makeContext());
      expect(() => client.extractData()).toThrow(/ssr/);
      expect(() => client.restoreData({})).toThrow(/ssr/);
    });
  });
});
