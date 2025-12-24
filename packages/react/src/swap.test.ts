import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import { signSwapTypedDataWith } from '@aave/client/viem';
import {
  BorrowSwapQuoteQuery,
  type PrepareBorrowSwapRequest,
  PreparePositionSwapQuery,
  type PrepareRepayWithSupplyRequest,
  type PrepareSupplySwapRequest,
  RepayWithSupplyQuoteQuery,
  SupplySwapQuoteQuery,
  SwapMutation,
} from '@aave/graphql';
import {
  makePositionSwapAdapterContractApproval,
  makePositionSwapPositionManagerApproval,
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
import { useBorrowSwap, useRepayWithSupply, useSupplySwap } from './swap';
import { renderHookWithinContext } from './test-utils';
import { useSendTransaction } from './viem';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(
  api.query(PreparePositionSwapQuery, () =>
    msw.HttpResponse.json({
      data: {
        value: {
          __typename: 'SwapByIntent',
          quote: makeSwapQuote(),
          data: makeSwapTypedData(),
        },
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
  msw.http.all('*', async () => msw.passthrough()),
);

describe('Given the swap hooks', () => {
  beforeAll(() => {
    server.listen();

    (BigInt.prototype as unknown as { toJSON: () => string }).toJSON =
      function () {
        return this.toString();
      };
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    delete (BigInt.prototype as unknown as { toJSON?: () => string }).toJSON;
  });

  describe(`When using the '${useSupplySwap.name}' hook`, () => {
    beforeEach(() => {
      server.use(
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
      } = renderHookWithinContext(() =>
        useSupplySwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return signSwapTypedDataWith(walletClient, plan.bySignature);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        }),
      );

      const result = await swap({} as PrepareSupplySwapRequest);

      assertOk(result);
    });

    it('Then it should support position swap with position manager and adapter contract approvals via transactions', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        return useSupplySwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return sendTransaction(plan.byTransaction);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        });
      });

      const result = await swap({} as PrepareSupplySwapRequest);

      assertOk(result);
    });
  });

  describe(`When using the '${useBorrowSwap.name}' hook`, () => {
    beforeEach(() => {
      server.use(
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
      } = renderHookWithinContext(() =>
        useBorrowSwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return signSwapTypedDataWith(walletClient, plan.bySignature);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        }),
      );

      const result = await swap({} as PrepareBorrowSwapRequest);

      assertOk(result);
    });

    it('Then it should support position swap with position manager and adapter contract approvals via transactions', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        return useBorrowSwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return sendTransaction(plan.byTransaction);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        });
      });

      const result = await swap({} as PrepareBorrowSwapRequest);

      assertOk(result);
    });
  });

  describe(`When using the '${useRepayWithSupply.name}' hook`, () => {
    beforeEach(() => {
      server.use(
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

    it('Then it should support position swap with position manager and adapter contract approvals via signatures', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() =>
        useRepayWithSupply((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return signSwapTypedDataWith(walletClient, plan.bySignature);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        }),
      );

      const result = await swap({} as PrepareRepayWithSupplyRequest);

      assertOk(result);
    });

    it('Then it should support position swap with position manager and adapter contract approvals via transactions', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        return useRepayWithSupply((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return sendTransaction(plan.byTransaction);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        });
      });

      const result = await swap({} as PrepareRepayWithSupplyRequest);

      assertOk(result);
    });
  });
});
