import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  PrepareOrderQuery,
  SubmitOrderMutation,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteRequest,
} from '@aave/graphql';
import {
  makeErc20Approval,
  makeOrderReceipt,
  makePreparedOrder,
  makeSwapByIntent,
  makeSwapByIntentWithApprovalRequired,
  makeSwapByTransaction,
  makeTransactionRequest,
} from '@aave/graphql/testing';
import { assertOk, evmAddress } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
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
import { useTokenSwapOrder } from './useTokenSwapOrder';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useTokenSwapOrder.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('When the order is by transaction', () => {
    beforeEach(() => {
      server.use(
        api.query(TokenSwapQuoteQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapByTransaction(),
            },
          }),
        ),
        api.mutation(SubmitOrderMutation, () =>
          msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'OrderTransactionRequest',
                transaction: dummyTransactionRequest,
                orderReceipt: makeOrderReceipt(),
              },
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

        return useTokenSwapOrder((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'OrderTransactionRequest':
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

  describe('When the order is by intent', () => {
    beforeEach(() => {
      server.use(
        api.query(TokenSwapQuoteQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapByIntent(),
            },
          }),
        ),
        api.query(PrepareOrderQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makePreparedOrder(),
            },
          }),
        ),
        api.mutation(SubmitOrderMutation, () =>
          msw.HttpResponse.json({
            data: { value: makeOrderReceipt() },
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
        const [signTypedData] = useSignTypedData(walletClient);

        return useTokenSwapOrder((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'OrderTypedData':
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

  describe('When the order is by intent with ERC-20 pre-approval', () => {
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
        api.query(PrepareOrderQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: makePreparedOrder(),
            },
          }),
        ),
        api.mutation(SubmitOrderMutation, () =>
          msw.HttpResponse.json({
            data: { value: makeOrderReceipt() },
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
        const [signTypedData] = useSignTypedData(walletClient);

        return useTokenSwapOrder((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'Erc20Approval':
              return sendTransaction(plan.byTransaction);

            case 'OrderTypedData':
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
