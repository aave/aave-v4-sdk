import { AaveClient } from '@aave/client';
import { ReservesRequestFilter } from '@aave/graphql';
import { chainId } from '@aave/types';
import { renderHook, waitFor } from '@testing-library/react';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
// biome-ignore lint/correctness/noUnusedImports: React is needed for JSX
import React, { type PropsWithChildren } from 'react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AaveContextProvider } from '../context';
import { useReserves } from '../reserves';

const TEST_BACKEND = 'https://api.test-reads.aave.com/graphql';

const requests: unknown[] = [];

const server = setupServer(
  msw.graphql.link(TEST_BACKEND).query('Reserves', ({ variables }) => {
    requests.push(variables);
    return msw.HttpResponse.json({ data: { value: [] } });
  }),
);

describe('Given two read hooks with equivalent requests', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());

  describe('When one spells out a schema default and the other omits it', () => {
    it('Then they share a single network request', async () => {
      const client = AaveClient.create({
        environment: {
          name: 'test',
          backend: TEST_BACKEND,
          indexingTimeout: 5_000,
          pollingInterval: 100,
          exchangeRateInterval: 1_000,
          swapQuoteInterval: 1_000,
          swapStatusInterval: 1_000,
        },
      });

      const { result } = renderHook(
        () => [
          useReserves({ query: { chainIds: [chainId(1)] } }),
          useReserves({
            query: { chainIds: [chainId(1)] },
            filter: ReservesRequestFilter.All,
          }),
        ],
        {
          wrapper: ({ children }: PropsWithChildren) => (
            <AaveContextProvider client={client}>
              {children}
            </AaveContextProvider>
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.every((r) => !r.loading)).toBe(true);
      });

      expect(requests).toHaveLength(1);
      expect(requests[0]).not.toHaveProperty('request.filter');
    });
  });
});
