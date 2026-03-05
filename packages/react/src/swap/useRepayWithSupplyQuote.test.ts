import {
  createNewWallet,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  QuoteAccuracy,
  RepayWithSupplyQuoteQuery,
  type RepayWithSupplyQuoteRequest,
} from '@aave/graphql';
import {
  makeReserveId,
  makeSwapQuote,
  makeUserBorrowItemId,
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
import { useRepayWithSupplyQuote } from './useRepayWithSupplyQuote';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useRepayWithSupplyQuote.name}' hook`, () => {
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
      api.query(RepayWithSupplyQuoteQuery, async ({ variables }) => {
        const accuracy =
          'market' in variables.request
            ? variables.request.market?.accuracy
            : undefined;

        if (accuracy === QuoteAccuracy.Fast) {
          const fastBuyAmount = Number(
            'market' in variables.request
              ? String(variables.request.market?.amount)
              : 0,
          );

          return msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'PositionSwapByIntentApprovalsRequired',
                approvals: [],
                quote: makeSwapQuote({
                  accuracy: QuoteAccuracy.Fast,
                  buyAmount: fastBuyAmount,
                }),
              },
            },
          });
        }

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

  describe('And a repay with supply quote request', () => {
    const request: RepayWithSupplyQuoteRequest = {
      market: {
        debtPosition: makeUserBorrowItemId(),
        repayWithReserve: makeReserveId(),
        amount: bigDecimal(1000),
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
          useRepayWithSupplyQuote(request),
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
          useRepayWithSupplyQuote(request),
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

    describe('When the request parameters change after an Accurate quote is shown', () => {
      it('Then it should surface the new Fast quote before the next Accurate quote arrives', async () => {
        const nextRequest: RepayWithSupplyQuoteRequest = {
          market: {
            ...request.market,
            amount: bigDecimal(2000),
          },
        };

        const { result, rerender } = renderHookWithinContext(
          ({ quoteRequest }) => useRepayWithSupplyQuote(quoteRequest),
          {
            initialProps: { quoteRequest: request },
          },
        );

        await vi.waitUntil(() => result.current.loading === false);

        act(() => releaseAccurateQuote(1));
        await vi.waitUntil(
          () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
        );
        expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(1);

        rerender({ quoteRequest: nextRequest });

        await vi.waitFor(() => {
          expect(result.current.data?.accuracy).toEqual(QuoteAccuracy.Fast);
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            2000,
          );
        });

        act(() => releaseAccurateQuote(2));

        await vi.waitUntil(
          () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
        );
        expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(2);
      });
    });
  });
});
