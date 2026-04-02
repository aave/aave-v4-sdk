import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  PreparePositionSwapQuery,
  SupplySwapQuoteQuery,
  type SupplySwapQuoteRequest,
  SwapMutation,
} from '@aave/graphql';
import {
  makePositionSwapAdapterContractApproval,
  makePositionSwapPositionManagerApproval,
  makePrepareSwapOrder,
  makeSwapQuote,
  makeSwapReceipt,
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
import { useSupplySwap } from './useSupplySwap';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useSupplySwap.name}' hook`, () => {
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
      api.query(SupplySwapQuoteQuery, () =>
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
                {
                  __typename: 'PositionSwapSetCollateralApproval',
                  bySignature: makeSwapTypedData(),
                },
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

        return useSupplySwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
            case 'PositionSwapSetCollateralApproval':
              return signSwapTypedData(plan.bySignature);

            case 'SwapTypedData':
              return signSwapTypedData(plan);
          }
        });
      });

      const result = await swap({} as SupplySwapQuoteRequest);

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

        return useSupplySwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
              return sendTransaction(plan.byTransaction);

            case 'PositionSwapAdapterContractApproval':
            case 'PositionSwapSetCollateralApproval':
              return signSwapTypedData(plan.bySignature);

            case 'SwapTypedData':
              return signSwapTypedData(plan);
          }
        });
      });

      const result = await swap({} as SupplySwapQuoteRequest);

      assertOk(result);
    });
  });
});
