import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  PrepareOrderQuery,
  SubmitOrderMutation,
  SupplySwapQuoteQuery,
  type SupplySwapQuoteRequest,
} from '@aave/graphql';
import {
  makeOrderReceipt,
  makePositionSwapAdapterContractApproval,
  makePositionSwapPositionManagerApproval,
  makePreparedOrder,
  makeSwapQuote,
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
import { useSupplySwapOrder } from './useSupplySwapOrder';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

describe(`Given the '${useSupplySwapOrder.name}' hook`, () => {
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
      api.query(PrepareOrderQuery, () =>
        msw.HttpResponse.json({
          data: {
            value: makePreparedOrder(),
          },
        }),
      ),
      api.mutation(SubmitOrderMutation, () =>
        msw.HttpResponse.json({
          data: {
            value: makeOrderReceipt(),
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
    it('Then it should complete the order', async () => {
      const {
        result: {
          current: [swapSupply],
        },
      } = renderHookWithinContext(() => {
        const [signTypedData] = useSignTypedData(walletClient);

        return useSupplySwapOrder((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
            case 'PositionSwapSetCollateralApproval':
              return signTypedData(plan.bySignature);

            case 'OrderTypedData':
              return signTypedData(plan);
          }
        });
      });

      const result = await swapSupply({} as SupplySwapQuoteRequest);

      assertOk(result);
    });
  });

  describe('When approving position manager via transaction', () => {
    it('Then it should complete the order', async () => {
      const {
        result: {
          current: [swapSupply],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        const [signTypedData] = useSignTypedData(walletClient);

        return useSupplySwapOrder((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
              return sendTransaction(plan.byTransaction);

            case 'PositionSwapAdapterContractApproval':
            case 'PositionSwapSetCollateralApproval':
              return signTypedData(plan.bySignature);

            case 'OrderTypedData':
              return signTypedData(plan);
          }
        });
      });

      const result = await swapSupply({} as SupplySwapQuoteRequest);

      assertOk(result);
    });
  });
});
