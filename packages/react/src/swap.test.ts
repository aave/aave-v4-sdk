import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import { signSwapTypedDataWith } from '@aave/client/viem';
import {
  BorrowSwapQuoteQuery,
  CancelSwapQuery,
  type PrepareBorrowSwapRequest,
  PreparePositionSwapQuery,
  type PrepareRepayWithSupplyRequest,
  type PrepareSupplySwapRequest,
  PrepareSwapCancelQuery,
  type PrepareSwapCancelRequest,
  PrepareTokenSwapQuery,
  type PrepareTokenSwapRequest,
  type PrepareWithdrawSwapRequest,
  RepayWithSupplyQuoteQuery,
  SupplySwapQuoteQuery,
  SwapMutation,
  SwapStatusQuery,
  WithdrawSwapQuoteQuery,
} from '@aave/graphql';
import {
  makePositionSwapAdapterContractApproval,
  makePositionSwapPositionManagerApproval,
  makeSwapCancelled,
  makeSwapOpen,
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
import {
  useBorrowSwap,
  useCancelSwap,
  useRepayWithSupply,
  useSupplySwap,
  useTokenSwap,
  useWithdrawSwap,
} from './swap';
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

  describe(`When using the '${useTokenSwap.name}' hook`, () => {
    describe('And the requested swap is by transaction', () => {
      beforeEach(() => {
        server.use(
          api.query(PrepareTokenSwapQuery, () =>
            msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'SwapByTransaction',
                  quote: makeSwapQuote(),
                },
              },
            }),
          ),
          api.mutation(SwapMutation, () =>
            msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'SwapTransactionRequest',
                  transaction: dummyTransactionRequest,
                  orderReceipt: makeSwapReceipt(),
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

          return useTokenSwap((plan, { cancel }) => {
            switch (plan.__typename) {
              case 'SwapTransactionRequest':
                return sendTransaction(plan.transaction);

              default:
                return cancel(`Unexpected plan: ${plan.__typename}`);
            }
          });
        });

        const result = await swap({} as PrepareTokenSwapRequest);

        assertOk(result);
      });
    });

    describe('And the requested swap is by transaction with ERC-20 pre-approval', () => {
      beforeEach(() => {
        server.use(
          api.query(PrepareTokenSwapQuery, () =>
            msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'SwapByTransaction',
                  quote: makeSwapQuote(),
                },
              },
            }),
          ),
          api.mutation(SwapMutation, () =>
            msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'SwapApprovalRequired',
                  approval: dummyTransactionRequest,
                  originalTransaction: {
                    __typename: 'SwapTransactionRequest',
                    transaction: dummyTransactionRequest,
                    orderReceipt: makeSwapReceipt(),
                  },
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

          return useTokenSwap((plan, { cancel }) => {
            switch (plan.__typename) {
              case 'SwapApprovalRequired':
                return sendTransaction(plan.approval);

              case 'SwapTransactionRequest':
                return sendTransaction(plan.transaction);

              default:
                return cancel(`Unexpected plan: ${plan.__typename}`);
            }
          });
        });

        const result = await swap({} as PrepareTokenSwapRequest);

        assertOk(result);
      });
    });

    describe('And the requested swap is by intent', () => {
      beforeEach(() => {
        server.use(
          api.query(PrepareTokenSwapQuery, () =>
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
              data: { value: makeSwapReceipt() },
            }),
          ),
        );
      });

      it('Then it should support the corresponding execution plan', async () => {
        server.use(
          api.query(PrepareTokenSwapQuery, () =>
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
        );

        const {
          result: {
            current: [swap],
          },
        } = renderHookWithinContext(() =>
          useTokenSwap((plan, { cancel }) => {
            switch (plan.__typename) {
              case 'SwapTypedData':
                return signSwapTypedDataWith(walletClient, plan);

              default:
                return cancel(`Unexpected plan: ${plan.__typename}`);
            }
          }),
        );

        const result = await swap({} as PrepareTokenSwapRequest);

        assertOk(result);
      });
    });

    describe('And the requested swap is by intent with ERC-20 pre-approval', () => {
      beforeEach(() => {
        server.use(
          api.query(PrepareTokenSwapQuery, () =>
            msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'SwapByIntentWithApprovalRequired',
                  approval: dummyTransactionRequest,
                  quote: makeSwapQuote(),
                  data: makeSwapTypedData(),
                },
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
          const [sendTransaction] = useSendTransaction(walletClient);
          return useTokenSwap((plan, { cancel }) => {
            switch (plan.__typename) {
              case 'SwapByIntentWithApprovalRequired':
                return sendTransaction(plan.approval);

              case 'SwapTypedData':
                return signSwapTypedDataWith(walletClient, plan);

              default:
                return cancel(`Unexpected plan: ${plan.__typename}`);
            }
          });
        });

        const result = await swap({} as PrepareTokenSwapRequest);

        assertOk(result);
      });
    });
  });

  describe(`When using the '${useCancelSwap.name}' hook`, () => {
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
          api.query(CancelSwapQuery, () =>
            msw.HttpResponse.json({
              data: {
                value: makeSwapCancelled(),
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
        } = renderHookWithinContext(() =>
          useCancelSwap((plan, { cancel }) => {
            switch (plan.__typename) {
              case 'SwapTypedData':
                return signSwapTypedDataWith(walletClient, plan);

              default:
                return cancel(`Unexpected plan: ${plan.__typename}`);
            }
          }),
        );

        const result = await cancelSwap({} as PrepareSwapCancelRequest);

        assertOk(result);
      });
    });

    describe('To cancel a swap-by-transaction', () => {
      beforeEach(() => {
        let firstStatusCall = true;
        server.use(
          api.query(SwapStatusQuery, () => {
            if (firstStatusCall) {
              firstStatusCall = false;
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
          api.query(CancelSwapQuery, () =>
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
          return useCancelSwap((plan) => {
            switch (plan.__typename) {
              case 'SwapTypedData':
                return signSwapTypedDataWith(walletClient, plan);

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

  describe(`When using the '${useWithdrawSwap.name}' hook`, () => {
    beforeEach(() => {
      server.use(
        api.query(WithdrawSwapQuoteQuery, () =>
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
        useWithdrawSwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return signSwapTypedDataWith(walletClient, plan.bySignature);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        }),
      );

      const result = await swap({} as PrepareWithdrawSwapRequest);

      assertOk(result);
    });

    it('Then it should support position swap with position manager and adapter contract approvals via transactions', async () => {
      const {
        result: {
          current: [swap],
        },
      } = renderHookWithinContext(() => {
        const [sendTransaction] = useSendTransaction(walletClient);
        return useWithdrawSwap((plan) => {
          switch (plan.__typename) {
            case 'PositionSwapPositionManagerApproval':
            case 'PositionSwapAdapterContractApproval':
              return sendTransaction(plan.byTransaction);

            case 'SwapByIntent':
              return signSwapTypedDataWith(walletClient, plan.data);
          }
        });
      });

      const result = await swap({} as PrepareWithdrawSwapRequest);

      assertOk(result);
    });
  });
});
