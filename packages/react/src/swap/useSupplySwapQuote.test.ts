import {
  createNewWallet,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  QuoteAccuracy,
  SupplySwapQuoteQuery,
  type SupplySwapQuoteRequest,
} from '@aave/graphql';
import {
  makeReserveId,
  makeSwapQuote,
  makeUserSupplyItemId,
} from '@aave/graphql/testing';
import { bigDecimal, evmAddress } from '@aave/types';
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
import { useSupplySwapQuote } from './useSupplySwapQuote';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useSupplySwapQuote.name}' hook`, () => {
  let releaseAccurateQuote: (value: number) => void;

  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    server.use(
      api.query(SupplySwapQuoteQuery, async ({ variables }) => {
        const accuracy =
          'market' in variables.request
            ? variables.request.market?.accuracy
            : undefined;

        if (accuracy === QuoteAccuracy.Fast) {
          return msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'PositionSwapByIntentApprovalsRequired',
                approvals: [],
                quote: makeSwapQuote({
                  accuracy: QuoteAccuracy.Fast,
                }),
              },
            },
          });
        }

        // Track Accurate requests and return different values for each call
        const buyAmount = await new Promise<number>((r) => {
          releaseAccurateQuote = r;
        });

        return msw.HttpResponse.json({
          data: {
            value: {
              __typename: 'PositionSwapByIntentApprovalsRequired',
              approvals: [],
              quote: makeSwapQuote({
                accuracy: QuoteAccuracy.Accurate,
                buyAmount,
              }),
            },
          },
        });
      }),
    );
  });

  describe('And a supply swap quote request', () => {
    const request: SupplySwapQuoteRequest = {
      market: {
        sellPosition: makeUserSupplyItemId(),
        buyReserve: makeReserveId(),
        amount: bigDecimal(1000),
        user: evmAddress(walletClient.account.address),
        enableCollateral: true,
      },
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('When rendered for the first time', () => {
      it('Then it should return a Fast quote and eventually update it with an Accurate one', async () => {
        const { result } = renderHookWithinContext(() =>
          useSupplySwapQuote(request),
        );

        await vi.waitUntil(() => result.current.loading === false);
        expect(result.current.data?.accuracy).toEqual(QuoteAccuracy.Fast);

        act(() => releaseAccurateQuote(42));

        await vi.waitUntil(
          () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
        );
        expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(42);
      });
    });

    describe('When the first Accurate quote is received', () => {
      it('Then it should poll for fresh Accurate quotes every 30 seconds', async () => {
        const { result } = renderHookWithinContext(() =>
          useSupplySwapQuote(request),
        );

        await vi.waitUntil(() => result.current.loading === false);
        act(() => releaseAccurateQuote(1));
        await vi.waitUntil(
          () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
        );

        await act(() => vi.advanceTimersToNextTimerAsync());
        act(() => releaseAccurateQuote(42));

        await vi.waitFor(() =>
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            42,
          ),
        );
      });
    });
  });
});
