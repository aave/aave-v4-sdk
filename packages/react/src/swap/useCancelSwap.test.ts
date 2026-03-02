import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  CancelSwapMutation,
  PrepareSwapCancelQuery,
  type PrepareSwapCancelRequest,
  SwapStatusQuery,
} from '@aave/graphql';
import {
  makeSwapCancelled,
  makeSwapCancelledResult,
  makeSwapOpen,
  makeSwapTypedData,
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
import { useCancelSwap } from './useCancelSwap';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useCancelSwap.name}' hook`, () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('To cancel a swap-by-intent', () => {
    beforeEach(() => {
      server.use(
        api.query(SwapStatusQuery, () =>
          msw.HttpResponse.json({
            data: { value: makeSwapOpen() },
          }),
        ),
        api.query(PrepareSwapCancelQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'PrepareSwapCancelResult',
                data: makeSwapTypedData(),
              },
            },
          }),
        ),
        api.mutation(CancelSwapMutation, () =>
          msw.HttpResponse.json({
            data: {
              value: makeSwapCancelledResult(),
            },
          }),
        ),
      );
    });

    it('Then it should support the corresponding execution plan', async () => {
      const {
        result: {
          current: [cancelSwap],
        },
      } = renderHookWithinContext(() => {
        const [signSwapTypedData] = useSignTypedData(walletClient);

        return useCancelSwap((plan, { cancel }) => {
          switch (plan.__typename) {
            case 'SwapTypedData':
              return signSwapTypedData(plan);

            default:
              return cancel(`Unexpected in this test: ${plan.__typename}`);
          }
        });
      });

      const result = await cancelSwap({} as PrepareSwapCancelRequest);

      assertOk(result);
    });
  });

  describe('To cancel a swap-by-transaction', () => {
    beforeEach(() => {
      let firstCall = true;
      server.use(
        api.query(SwapStatusQuery, () => {
          if (firstCall) {
            firstCall = false;
            return msw.HttpResponse.json({
              data: {
                value: makeSwapOpen(),
              },
            });
          }
          return msw.HttpResponse.json({
            data: {
              value: makeSwapCancelled(),
            },
          });
        }),
        api.query(PrepareSwapCancelQuery, () =>
          msw.HttpResponse.json({
            data: {
              value: {
                __typename: 'PrepareSwapCancelResult',
                data: makeSwapTypedData(),
              },
            },
          }),
        ),
        api.mutation(CancelSwapMutation, () =>
          msw.HttpResponse.json({
            data: { value: dummyTransactionRequest },
          }),
        ),
      );
    });

    it('Then it should support the corresponding execution plan', async () => {
      const {
        result: {
          current: [cancelSwap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        const [signSwapTypedData] = useSignTypedData(walletClient);

        return useCancelSwap((plan) => {
          switch (plan.__typename) {
            case 'SwapTypedData':
              return signSwapTypedData(plan);

            case 'TransactionRequest':
              return sendTransaction(plan);
          }
        });
      });

      const result = await cancelSwap({} as PrepareSwapCancelRequest);

      assertOk(result);
    });
  });
});
