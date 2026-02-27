import {
  QuoteAccuracy,
  TokenSwapKind,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteRequest,
} from '@aave/graphql';
import { makeSwapByIntent, makeSwapQuote } from '@aave/graphql/testing';
import { bigDecimal, chainId, evmAddress } from '@aave/types';
import { act } from '@testing-library/react';
import * as msw from 'msw';
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

import { api, server, walletClient } from './test-setup';
import { useTokenSwapQuote } from './useTokenSwapQuote';

describe(`Given the '${useTokenSwapQuote.name}' hook`, () => {
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
      api.query(TokenSwapQuoteQuery, async ({ variables }) => {
        const accuracy =
          'market' in variables.request
            ? variables.request.market?.accuracy
            : undefined;

        if (accuracy === QuoteAccuracy.Fast) {
          return msw.HttpResponse.json({
            data: {
              value: makeSwapByIntent({
                quote: makeSwapQuote({
                  accuracy: QuoteAccuracy.Fast,
                }),
              }),
            },
          });
        }

        // Track Accurate requests and return different values for each call
        const buyAmount = await new Promise<number>((r) => {
          releaseAccurateQuote = r;
        });
        // await delay(100); // Simulate network delay

        return msw.HttpResponse.json({
          data: {
            value: makeSwapByIntent({
              quote: makeSwapQuote({
                accuracy: QuoteAccuracy.Accurate,
                buyAmount,
              }),
            }),
          },
        });
      }),
    );
  });

  // Note: Only testing Market orders for Fast/Accurate quote behavior
  // Limit orders no longer have an accuracy field in the schema
  describe('And a token swap quote request', () => {
    const request: TokenSwapQuoteRequest = {
      market: {
        chainId: chainId(1),
        buy: {
          erc20: evmAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        },
        sell: {
          erc20: evmAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
        },
        amount: bigDecimal(1000),
        kind: TokenSwapKind.Sell,
        user: evmAddress(walletClient.account.address),
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
          useTokenSwapQuote(request),
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
          useTokenSwapQuote(request),
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
