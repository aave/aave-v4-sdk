import { AaveClient } from '@aave/client';
import { environment } from '@aave/client/testing';
import {
  OrderStatusFilter,
  PendingOrdersQuery,
  type PendingOrdersRequest,
  PrepareOrderQuery,
  SubmitOrderMutation,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteRequest,
  UserBalancesQuery,
} from '@aave/graphql';
import {
  makeOrderCancelled,
  makeOrderOpen,
  makeOrderReceipt,
  makePaginatedOrdersResult,
  makePreparedOrder,
  makeSwapByIntent,
} from '@aave/graphql/testing';
import {
  assertOk,
  chainId,
  evmAddress,
  okAsync,
  signatureFrom,
} from '@aave/types';
import { act } from '@testing-library/react';
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
import { renderHookWithinContext } from '../test-utils';
import { usePendingOrders } from './usePendingOrders';
import { useTokenSwapOrder } from './useTokenSwapOrder';

const api = msw.graphql.link(environment.backend);

const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${usePendingOrders.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
    vi.useFakeTimers();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    vi.useRealTimers();
    server.close();
  });

  const request: PendingOrdersRequest = {
    chainId: chainId(1),
    user: evmAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e'),
  };

  describe('And the user has no orders', () => {
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(PendingOrdersQuery, () => {
          requestCount++;

          return msw.HttpResponse.json({
            data: { value: makePaginatedOrdersResult([]) },
          });
        }),
      );
    });

    describe('When rendered', () => {
      it('Then it should not poll after the first response', async () => {
        const { result } = renderHookWithinContext(() =>
          usePendingOrders(request),
        );

        await vi.waitUntil(() => result.current.loading === false);

        expect(result.current.data?.items).toHaveLength(0);

        const countAfterFirstResponse = requestCount;

        await act(() => vi.advanceTimersToNextTimerAsync());

        expect(requestCount).toBe(countAfterFirstResponse);
      });
    });
  });

  describe('And the user has an open order', () => {
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(PendingOrdersQuery, () => {
          requestCount++;

          return msw.HttpResponse.json({
            data: { value: makePaginatedOrdersResult([makeOrderOpen()]) },
          });
        }),
      );
    });

    describe('When rendered', () => {
      it('Then it should poll for fresh data', async () => {
        const { result } = renderHookWithinContext(() =>
          usePendingOrders(request),
        );

        await vi.waitUntil(() => result.current.loading === false);

        const countAfterFirstResponse = requestCount;

        await act(() => vi.advanceTimersToNextTimerAsync());

        await vi.waitUntil(() => requestCount > countAfterFirstResponse);
      });
    });
  });

  describe('And the open order leaves the filtered list', () => {
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(PendingOrdersQuery, () => {
          requestCount++;

          return msw.HttpResponse.json({
            data: {
              value: makePaginatedOrdersResult(
                requestCount === 1 ? [makeOrderOpen()] : [],
              ),
            },
          });
        }),
      );
    });

    describe('When polling', () => {
      it('Then it should stop polling once the list is empty', async () => {
        const { result } = renderHookWithinContext(() =>
          usePendingOrders(request),
        );

        await vi.waitUntil(() => result.current.data?.items.length === 1);

        await act(() => vi.advanceTimersToNextTimerAsync());

        await vi.waitUntil(() => result.current.data?.items.length === 0);

        const countAfterEmpty = requestCount;

        await act(() => vi.advanceTimersToNextTimerAsync());

        expect(requestCount).toBe(countAfterEmpty);
      });
    });
  });

  describe('And the response contains only terminal orders', () => {
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(PendingOrdersQuery, () => {
          requestCount++;

          return msw.HttpResponse.json({
            data: {
              value: makePaginatedOrdersResult([makeOrderCancelled()]),
            },
          });
        }),
      );
    });

    describe('When rendered', () => {
      it('Then it should not poll after the first response', async () => {
        const { result } = renderHookWithinContext(() =>
          usePendingOrders(request),
        );

        await vi.waitUntil(() => result.current.loading === false);

        const countAfterFirstResponse = requestCount;

        await act(() => vi.advanceTimersToNextTimerAsync());

        expect(requestCount).toBe(countAfterFirstResponse);
      });
    });
  });

  describe('And an open token swap leaves the filtered list', () => {
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(PendingOrdersQuery, () => {
          requestCount++;

          return msw.HttpResponse.json({
            data: {
              value: makePaginatedOrdersResult(
                requestCount === 1 ? [makeOrderOpen()] : [],
              ),
            },
          });
        }),
      );
    });

    describe('When the poll no longer returns it', () => {
      it('Then it should refresh the user balances', async () => {
        const client = AaveClient.create({ environment });
        const refreshQueryWhere = vi.spyOn(client, 'refreshQueryWhere');

        const { result } = renderHookWithinContext(
          () =>
            usePendingOrders({
              ...request,
              filterBy: [
                OrderStatusFilter.Open,
                OrderStatusFilter.PendingSignature,
              ],
            }),
          { client },
        );

        await vi.waitUntil(() => result.current.data?.items.length === 1);
        expect(refreshQueryWhere).not.toHaveBeenCalledWith(
          UserBalancesQuery,
          expect.anything(),
        );

        await act(() => vi.advanceTimersToNextTimerAsync());

        await vi.waitUntil(() => result.current.data?.items.length === 0);
        expect(refreshQueryWhere).toHaveBeenCalledWith(
          UserBalancesQuery,
          expect.any(Function),
        );
      });
    });
  });

  describe('And the user submits a new order', () => {
    let submitted: boolean;

    beforeEach(() => {
      submitted = false;

      server.use(
        api.query(PendingOrdersQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makePaginatedOrdersResult(
                submitted ? [makeOrderOpen()] : [],
              ),
            },
          }),
        ),
        api.query(TokenSwapQuoteQuery, () =>
          msw.HttpResponse.json({ data: { value: makeSwapByIntent() } }),
        ),
        api.query(PrepareOrderQuery, () =>
          msw.HttpResponse.json({ data: { value: makePreparedOrder() } }),
        ),
        api.mutation(SubmitOrderMutation, () => {
          submitted = true;

          return msw.HttpResponse.json({ data: { value: makeOrderReceipt() } });
        }),
      );
    });

    describe('When the order is submitted', () => {
      it('Then it should refresh the list to show the new order', async () => {
        const { result } = renderHookWithinContext(() => ({
          pendingOrders: usePendingOrders(request),
          swap: useTokenSwapOrder(() => okAsync(signatureFrom('0xdeadbeef'))),
        }));

        await vi.waitUntil(
          () => result.current.pendingOrders.loading === false,
        );
        expect(result.current.pendingOrders.data?.items).toHaveLength(0);

        const [swap] = result.current.swap;
        assertOk(await swap({} as TokenSwapQuoteRequest));

        await vi.waitUntil(
          () => result.current.pendingOrders.data?.items.length === 1,
        );
      });
    });
  });
});
