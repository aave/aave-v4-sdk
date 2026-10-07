import {
  ActivitiesQuery,
  ActivityType,
  normalizeVariables,
  PageSize,
  ReservesQuery,
  ReservesRequestFilter,
  UserBalancesQuery,
} from '@aave/graphql';
import { assertOk, chainId, evmAddress } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AaveClient } from './AaveClient';
import { reserves } from './actions';

const TEST_BACKEND = 'https://api.test-normalize.aave.com/graphql';

const testEnvironment = {
  name: 'test',
  backend: TEST_BACKEND,
  indexingTimeout: 5_000,
  pollingInterval: 100,
  exchangeRateInterval: 1_000,
  swapQuoteInterval: 1_000,
  swapStatusInterval: 1_000,
} as const;

const user = evmAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');

describe('Given the normalizeVariables helper', () => {
  describe('When a request field equals its schema default', () => {
    it('Then it is removed', () => {
      const result = normalizeVariables(ReservesQuery, {
        request: {
          query: { chainIds: [chainId(1)] },
          filter: ReservesRequestFilter.All,
        },
      });

      expect(result).toEqual({
        request: { query: { chainIds: [chainId(1)] } },
      });
    });

    it('Then object defaults are removed too', () => {
      const result = normalizeVariables(UserBalancesQuery, {
        request: {
          user,
          filter: { chains: { chainIds: [chainId(1)] } },
          orderBy: { balance: 'DESC' },
          includeZeroBalances: false,
        },
      });

      expect(result).toEqual({
        request: { user, filter: { chains: { chainIds: [chainId(1)] } } },
      });
    });
  });

  describe('When a nested input field equals its schema default', () => {
    it('Then it is removed', () => {
      const result = normalizeVariables(UserBalancesQuery, {
        request: {
          user,
          filter: {
            chains: {
              chainIds: [chainId(1)],
              byReservesType: ReservesRequestFilter.All,
            },
          },
        },
      });

      expect(result).toEqual({
        request: { user, filter: { chains: { chainIds: [chainId(1)] } } },
      });
    });
  });

  describe('When a request field differs from its schema default', () => {
    it('Then it is kept', () => {
      const variables = {
        request: {
          query: { chainIds: [chainId(1)] },
          filter: ReservesRequestFilter.Supply,
        },
      };

      expect(normalizeVariables(ReservesQuery, variables)).toBe(variables);
    });

    it('Then a list in a different order than the default is kept', () => {
      const variables = {
        request: {
          query: { chainIds: [chainId(1)] },
          types: [ActivityType.Supply, ActivityType.Borrow],
          pageSize: PageSize.Ten,
        },
      };

      expect(normalizeVariables(ActivitiesQuery, variables)).toBe(variables);
    });
  });

  describe('When nothing equals a schema default', () => {
    it('Then the same object is returned', () => {
      const variables = { request: { query: { chainIds: [chainId(1)] } } };

      expect(normalizeVariables(ReservesQuery, variables)).toBe(variables);
    });
  });
});

describe('Given an AaveClient', () => {
  const requests: unknown[] = [];

  const server = setupServer(
    msw.graphql.link(TEST_BACKEND).query('Reserves', ({ variables }) => {
      requests.push(variables);
      return msw.HttpResponse.json({ data: { value: [] } });
    }),
  );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    requests.length = 0;
  });
  afterAll(() => server.close());

  describe('When a query is sent with a schema default', () => {
    it('Then the default is left out of the request', async () => {
      const client = AaveClient.create({
        environment: testEnvironment,
        batch: false,
      });

      const result = await reserves(
        client,
        {
          query: { chainIds: [chainId(1)] },
          filter: ReservesRequestFilter.All,
        },
        { requestPolicy: 'network-only' },
      );

      assertOk(result);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        request: { query: { chainIds: [1] } },
      });
      expect(requests[0]).not.toHaveProperty('request.filter');
    });
  });
});
