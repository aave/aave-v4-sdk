import {
  PreparePositionSwapQuery,
  RepayWithSupplyQuoteQuery,
  type RepayWithSupplyQuoteRequest,
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
import { useRepayWithSupply } from './useRepayWithSupply';

describe(`Given the '${useRepayWithSupply.name}' hook`, () => {
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
      api.query(RepayWithSupplyQuoteQuery, () =>
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

  describe('When approving all via signatures', () => {
    it('Then it should complete the swap', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [signSwapTypedData] = useSignTypedData(walletClient);

        return useRepayWithSupply((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return signSwapTypedData(plan.bySignature);

            case 'SwapTypedData':
              return signSwapTypedData(plan);
          }
        });
      });

      const result = await swap({} as RepayWithSupplyQuoteRequest);

      assertOk(result);
    });
  });

  describe('When approving position manager via transaction', () => {
    it('Then it should complete the swap', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        const [signSwapTypedData] = useSignTypedData(walletClient);

        return useRepayWithSupply((plan) => {
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

      const result = await swap({} as RepayWithSupplyQuoteRequest);

      assertOk(result);
    });
  });
});
