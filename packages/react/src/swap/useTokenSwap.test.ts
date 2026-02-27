import {
  PrepareTokenSwapQuery,
  SwapMutation,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteRequest,
} from '@aave/graphql';
import {
  makeErc20Approval,
  makePrepareSwapOrder,
  makeSwapByIntent,
  makeSwapByIntentWithApprovalRequired,
  makeSwapByTransaction,
  makeSwapReceipt,
  makeSwapTransactionRequest,
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
import { useTokenSwap } from './useTokenSwap';

describe(`Given the '${useTokenSwap.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('When the swap is by transaction', () => {
    beforeEach(() => {
      server.use(
        api.query(TokenSwapQuoteQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapByTransaction(),
            },
          }),
        ),
        api.mutation(SwapMutation, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapTransactionRequest({
                transaction: dummyTransactionRequest,
              }),
            },
          }),
        ),
      );
    });

    it('Then it should support the corresponding execution plan', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);

        return useTokenSwap((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'SwapTransactionRequest':
              return sendTransaction(plan.transaction);

            default:
              return cancel(`Unexpected in this test: ${plan.__typename}`);
          }
        });
      });

      const result = await swap({} as TokenSwapQuoteRequest);

      assertOk(result);
    });
  });

  describe('When the swap is by intent', () => {
    beforeEach(() => {
      server.use(
        api.query(TokenSwapQuoteQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapByIntent(),
            },
          }),
        ),
        api.query(PrepareTokenSwapQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makePrepareSwapOrder(),
            },
          }),
        ),
        api.mutation(SwapMutation, () =>
          msw.HttpResponse.json({
            data: { value: makeSwapReceipt() },
          }),
        ),
      );
    });

    it('Then it should support the corresponding execution plan', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [signSwapTypedData] = useSignTypedData(walletClient);

        return useTokenSwap((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'SwapTypedData':
              return signSwapTypedData(plan);

            default:
              return cancel(`Unexpected in this test: ${plan.__typename}`);
          }
        });
      });

      const result = await swap({} as TokenSwapQuoteRequest);

      assertOk(result);
    });
  });

  describe('When the swap is by intent with ERC-20 pre-approval', () => {
    beforeEach(() => {
      server.use(
        api.query(TokenSwapQuoteQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapByIntentWithApprovalRequired({
                approval: makeErc20Approval({
                  byTransaction: dummyTransactionRequest,
                }),
              }),
            },
          }),
        ),
        api.query(PrepareTokenSwapQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makePrepareSwapOrder(),
            },
          }),
        ),
        api.mutation(SwapMutation, () =>
          msw.HttpResponse.json({
            data: { value: makeSwapReceipt() },
          }),
        ),
      );
    });

    it('Then it should support the flow involving a pre-approval by transaction', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        const [signSwapTypedData] = useSignTypedData(walletClient);

        return useTokenSwap((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'Erc20Approval':
              return sendTransaction(plan.byTransaction);

            case 'SwapTypedData':
              return signSwapTypedData(plan);

            default:
              return cancel(`Unexpected in this test: ${plan.__typename}`);
          }
        });
      });

      const result = await swap({} as TokenSwapQuoteRequest);

      assertOk(result);
    });

    it('Then it should support the flow involving a pre-approval by signature', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [signTypedData] = useSignTypedData(walletClient);

        return useTokenSwap((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'Erc20Approval':
              return signTypedData(plan.bySignature!);

            case 'SwapTypedData':
              return signTypedData(plan);

            default:
              return cancel(`Unexpected in this test: ${plan.__typename}`);
          }
        });
      });

      const result = await swap({} as TokenSwapQuoteRequest);

      assertOk(result);
    });
  });
});
