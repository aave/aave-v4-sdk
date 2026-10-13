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
  describe('When a request field with a schema default is left out', () => {
    it('Then the default is filled in', () => {
      const result = normalizeVariables(ReservesQuery, {
        request: { query: { chainIds: [chainId(1)] } },
      });

      expect(result).toEqual({
        request: {
          query: { chainIds: [chainId(1)] },
          filter: ReservesRequestFilter.All,
          orderBy: { assetName: 'ASC' },
        },
      });
    });

    it('Then it matches the request that spells the defaults out', () => {
      const omitted = normalizeVariables(UserBalancesQuery, {
        request: { user, filter: { chains: { chainIds: [chainId(1)] } } },
      });
      const explicit = normalizeVariables(UserBalancesQuery, {
        request: {
          user,
          filter: {
            chains: {
              chainIds: [chainId(1)],
              byReservesType: ReservesRequestFilter.All,
            },
          },
          orderBy: { balance: 'DESC' },
          includeZeroBalances: false,
        },
      });

      expect(omitted).toEqual(explicit);
    });
  });

  describe('When a nested input with a schema default is passed', () => {
    it('Then its defaults are filled in', () => {
      const result = normalizeVariables(UserBalancesQuery, {
        request: { user, filter: { chains: { chainIds: [chainId(1)] } } },
      });

      expect(result).toMatchObject({
        request: {
          filter: {
            chains: {
              chainIds: [chainId(1)],
              byReservesType: ReservesRequestFilter.All,
            },
          },
        },
      });
    });
  });

  describe('When an optional input is left out', () => {
    it('Then it is not created to carry its defaults', () => {
      const result = normalizeVariables(UserBalancesQuery, {
        request: { user, filter: { hubId: 'hub-id' } },
      });

      expect(result).toEqual({
        request: {
          user,
          filter: { hubId: 'hub-id' },
          orderBy: { balance: 'DESC' },
          includeZeroBalances: false,
        },
      });
    });
  });

  describe('When a request field is set', () => {
    it('Then its value is kept', () => {
      const result = normalizeVariables(ActivitiesQuery, {
        request: {
          query: { chainIds: [chainId(1)] },
          types: [ActivityType.Supply, ActivityType.Borrow],
          pageSize: PageSize.Ten,
        },
      });

      expect(result).toEqual({
        request: {
          query: { chainIds: [chainId(1)] },
          types: [ActivityType.Supply, ActivityType.Borrow],
          pageSize: PageSize.Ten,
        },
      });
    });

    it('Then an explicit null is kept', () => {
      const result = normalizeVariables(ReservesQuery, {
        request: {
          query: { chainIds: [chainId(1)] },
          filter: null,
          orderBy: { assetName: 'ASC' },
        },
      });

      expect(result).toEqual({
        request: {
          query: { chainIds: [chainId(1)] },
          filter: null,
          orderBy: { assetName: 'ASC' },
        },
      });
    });
  });

  describe('When every default is already set', () => {
    it('Then the same object is returned', () => {
      const variables = {
        request: {
          query: { chainIds: [chainId(1)] },
          filter: ReservesRequestFilter.Supply,
          orderBy: { assetName: 'ASC' },
        },
      };

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

  describe('When a query leaves out a schema default', () => {
    it('Then the default is sent in the request', async () => {
      const client = AaveClient.create({
        environment: testEnvironment,
        batch: false,
      });

      const result = await reserves(
        client,
        { query: { chainIds: [chainId(1)] } },
        { requestPolicy: 'network-only' },
      );

      assertOk(result);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        request: { query: { chainIds: [1] }, filter: 'ALL' },
      });
    });
  });
});
