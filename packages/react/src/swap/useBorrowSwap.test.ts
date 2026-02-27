import {
  BorrowSwapQuoteQuery,
  type BorrowSwapQuoteRequest,
  PreparePositionSwapQuery,
  SwapMutation,
} from '@aave/graphql';
import {
  makePositionSwapAdapterContractApproval,
  makePositionSwapPositionManagerApproval,
  makePrepareSwapOrder,
  makeSwapQuote,
  makeSwapReceipt,
} from '@aave/graphql/testing';
import { assertOk } from '@aave/types';
import * as msw from 'msw';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest';

import { renderHookWithinContext } from '../test-utils';
import { useSendTransaction, useSignTypedData } from '../viem';

import {
  api,
  dummyTransactionRequest,
  server,
  walletClient,
} from './test-setup';
import { useBorrowSwap } from './useBorrowSwap';

describe(`Given the '${useBorrowSwap.name}' hook`, () => {
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
      api.query(PreparePositionSwapQuery, () =>
        msw.HttpResponse.json({
          data: {
            value: makePrepareSwapOrder(),
          },
        }),
      ),
      api.mutation(SwapMutation, () =>
        msw.HttpResponse.json({
          data: {
            value: makeSwapReceipt(),
          },
        }),
      ),
      api.query(BorrowSwapQuoteQuery, () =>
        msw.HttpResponse.json({
          data: {
            value: {
              __typename: 'PositionSwapByIntentApprovalsRequired',
              quote: makeSwapQuote(),
              approvals: [
                makePositionSwapPositionManagerApproval({
                  byTransaction: dummyTransactionRequest,
                }),
                makePositionSwapAdapterContractApproval({
                  byTransaction: dummyTransactionRequest,
                }),
              ],
            },
          },
        }),
      ),
    );
  });

  it('Then it should support position swap with position manager and adapter contract approvals via signatures', async () => {
    const {
      result: {
        current: [swap],
      },
    } = renderHookWithinContext(() => {
      const [signSwapTypedData] = useSignTypedData(walletClient);

      return useBorrowSwap((plan) => {
        switch (plan.__typename) {
          case 'PositionSwapPositionManagerApproval':
          case 'PositionSwapAdapterContractApproval':
            return signSwapTypedData(plan.bySignature);

          case 'SwapTypedData':
            return signSwapTypedData(plan);
        }
      });
    });

    const result = await swap({} as BorrowSwapQuoteRequest);

    assertOk(result);
  });

  it('Then it should support position swap with position manager approval via transaction and adapter contract approval via signature', async () => {
    const {
      result: {
        current: [swap],
      },
    } = renderHookWithinContext(() => {
      const [sendTransaction] = useSendTransaction(walletClient);
      const [signSwapTypedData] = useSignTypedData(walletClient);

      return useBorrowSwap((plan) => {
        switch (plan.__typename) {
          case 'PositionSwapPositionManagerApproval':
            return sendTransaction(plan.byTransaction);

          case 'PositionSwapAdapterContractApproval':
            return signSwapTypedData(plan.bySignature);

          case 'SwapTypedData':
            return signSwapTypedData(plan);
        }
      });
    });

    const result = await swap({} as BorrowSwapQuoteRequest);

    assertOk(result);
  });
});
