import {
  createNewWallet,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import { UserSwapsQuery, type UserSwapsRequest } from '@aave/graphql';
import {
  makePaginatedUserSwapsResult,
  makeSwapCancelled,
  makeSwapFulfilled,
  makeSwapOpen,
} from '@aave/graphql/testing';
import { chainId, evmAddress } from '@aave/types';
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
import { useUserSwaps } from './useUserSwaps';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useUserSwaps.name}' hook`, () => {
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

  const request: UserSwapsRequest = {
    chainId: chainId(1),
    user: evmAddress(walletClient.account.address),
  };

  describe('And a list of swaps with non-terminal statuses', () => {
    let releaseNextPoll: () => void;

    beforeEach(() => {
      let firstResponse = true;

      server.use(
        api.query(UserSwapsQuery, async () => {
          if (firstResponse) {
            firstResponse = false;

            return msw.HttpResponse.json({
              data: {
                value: makePaginatedUserSwapsResult([makeSwapOpen()]),
              },
            });
          }

          await new Promise<void>((r) => {
            releaseNextPoll = r;
          });

          return msw.HttpResponse.json({
            data: {
              value: makePaginatedUserSwapsResult([makeSwapOpen()]),
            },
          });
        }),
      );
    });

    describe('When rendered for the first time', () => {
      it('Then it should return the swap list', async () => {
        const { result } = renderHookWithinContext(() => useUserSwaps(request));

        await vi.waitUntil(() => result.current.loading === false);

        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0]!.__typename).toBe('SwapOpen');
      });
    });

    describe('When polling', () => {
      it('Then it should poll for fresh data while swaps are non-terminal', async () => {
        const { result } = renderHookWithinContext(() => useUserSwaps(request));

        await vi.waitUntil(() => result.current.loading === false);

        // Advance to trigger next poll
        await act(() => vi.advanceTimersToNextTimerAsync());
        act(() => releaseNextPoll());

        // The poll should have completed — releaseNextPoll being called confirms polling happened
        await vi.waitUntil(() => result.current.loading === false);
      });
    });
  });

  describe('And all swaps transition to terminal statuses', () => {
    let releaseTerminalResponse: () => void;
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(UserSwapsQuery, async () => {
          requestCount++;

          if (requestCount === 1) {
            return msw.HttpResponse.json({
              data: {
                value: makePaginatedUserSwapsResult([makeSwapOpen()]),
              },
            });
          }

          await new Promise<void>((r) => {
            releaseTerminalResponse = r;
          });

          return msw.HttpResponse.json({
            data: {
              value: makePaginatedUserSwapsResult([makeSwapFulfilled()]),
            },
          });
        }),
      );
    });

    describe('When polling after terminal transition', () => {
      it('Then it should stop polling once all items are terminal', async () => {
        const { result } = renderHookWithinContext(() => useUserSwaps(request));

        await vi.waitUntil(() => result.current.loading === false);
        expect(result.current.data?.items[0]!.__typename).toBe('SwapOpen');

        // Advance to trigger next poll
        await act(() => vi.advanceTimersToNextTimerAsync());
        act(() => releaseTerminalResponse());

        await vi.waitUntil(
          () => result.current.data?.items[0]!.__typename === 'SwapFulfilled',
        );

        // Record request count after terminal state
        const countAfterTerminal = requestCount;

        // Advance timers again — no new request should be made
        await act(() => vi.advanceTimersToNextTimerAsync());

        expect(requestCount).toBe(countAfterTerminal);
      });
    });
  });

  describe('And the response contains only terminal swaps from the start', () => {
    let requestCount: number;

    beforeEach(() => {
      requestCount = 0;

      server.use(
        api.query(UserSwapsQuery, () => {
          requestCount++;

          return msw.HttpResponse.json({
            data: {
              value: makePaginatedUserSwapsResult([makeSwapCancelled()]),
            },
          });
        }),
      );
    });

    describe('When rendered', () => {
      it('Then it should stop polling immediately after the first response', async () => {
        const { result } = renderHookWithinContext(() =>
          useUserSwaps({
            ...request,
            filterBy: [],
          }),
        );

        await vi.waitUntil(() => result.current.loading === false);

        expect(result.current.data?.items[0]!.__typename).toBe('SwapCancelled');

        const countAfterFirstResponse = requestCount;

        // Advance timers — no new request should be made
        await act(() => vi.advanceTimersToNextTimerAsync());

        expect(requestCount).toBe(countAfterFirstResponse);
      });
    });
  });
});
