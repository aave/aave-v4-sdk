import {
  createNewWallet,
  ETHEREUM_FORK_ID,
  environment,
  fundNativeAddress,
} from '@aave/client/testing';
import {
  BorrowSwapQuoteQuery,
  type BorrowSwapQuoteRequest,
  CancelSwapMutation,
  PreparePositionSwapQuery,
  PrepareSwapCancelQuery,
  type PrepareSwapCancelRequest,
  PrepareTokenSwapQuery,
  QuoteAccuracy,
  RepayWithSupplyQuoteQuery,
  type RepayWithSupplyQuoteRequest,
  SupplySwapQuoteQuery,
  type SupplySwapQuoteRequest,
  SwapMutation,
  SwapStatusQuery,
  TokenSwapKind,
  TokenSwapQuoteQuery,
  type TokenSwapQuoteRequest,
  WithdrawSwapQuoteQuery,
  type WithdrawSwapQuoteRequest,
} from '@aave/graphql';
import {
  makeErc20Approval,
  makePositionSwapAdapterContractApproval,
  makePositionSwapPositionManagerApproval,
  makePrepareSwapOrder,
  makeReserveId,
  makeSwapByIntent,
  makeSwapByIntentWithApprovalRequired,
  makeSwapByTransaction,
  makeSwapCancelled,
  makeSwapCancelledResult,
  makeSwapOpen,
  makeSwapQuote,
  makeSwapReceipt,
  makeSwapTransactionRequest,
  makeSwapTypedData,
  makeTransactionRequest,
  makeUserBorrowItemId,
  makeUserSupplyItemId,
} from '@aave/graphql/testing';
import { assertOk, bigDecimal, chainId, evmAddress } from '@aave/types';
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
import {
  useBorrowSwap,
  useBorrowSwapQuote,
  useCancelSwap,
  useRepayWithSupply,
  useRepayWithSupplyQuote,
  useSupplySwap,
  useSupplySwapQuote,
  useTokenSwap,
  useTokenSwapQuote,
  useWithdrawSwap,
  useWithdrawSwapQuote,
} from './swap';
import { renderHookWithinContext } from './test-utils';
import { useSendTransaction, useSignTypedData } from './viem';

const walletClient = await createNewWallet();
await fundNativeAddress(evmAddress(walletClient.account.address));

const dummyTransactionRequest = makeTransactionRequest({
  chainId: ETHEREUM_FORK_ID,
  from: evmAddress(walletClient.account.address),
});

const api = msw.graphql.link(environment.backend);
const server = setupServer(msw.http.all('*', async () => msw.passthrough()));

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

  describe(`And using the '${useTokenSwap.name}' hook`, () => {
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

  describe('And position swap hooks', () => {
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
      );
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
        } = renderHookWithinContext(() => {
          const [signSwapTypedData] = useSignTypedData(walletClient);

          return useSupplySwap((plan) => {
            switch (plan.__typename) {
              case 'PositionSwapPositionManagerApproval':
              case 'PositionSwapAdapterContractApproval':
                return signSwapTypedData(plan.bySignature);

              case 'SwapTypedData':
                return signSwapTypedData(plan);
            }
          });
        });

        const result = await swap({} as SupplySwapQuoteRequest);

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

          return useSupplySwap((plan) => {
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

        const result = await swap({} as SupplySwapQuoteRequest);

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

      it('Then it should support position swap with position manager approval via transaction and adapter contract approval via signature', async () => {
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
        } = renderHookWithinContext(() => {
          const [signSwapTypedData] = useSignTypedData(walletClient);

          return useWithdrawSwap((plan) => {
            switch (plan.__typename) {
              case 'PositionSwapPositionManagerApproval':
              case 'PositionSwapAdapterContractApproval':
                return signSwapTypedData(plan.bySignature);

              case 'SwapTypedData':
                return signSwapTypedData(plan);
            }
          });
        });

        const result = await swap({} as WithdrawSwapQuoteRequest);

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

          return useWithdrawSwap((plan) => {
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

        const result = await swap({} as WithdrawSwapQuoteRequest);

        assertOk(result);
      });
    });
  });

  describe(`And using the '${useTokenSwapQuote.name}' hook`, () => {
    let releaseAccurateQuote: (value: number) => void;

    beforeEach(() => {
      server.use(
        api.query(TokenSwapQuoteQuery, async ({ variables }) => {
          const accuracy =
            'market' in variables.request
              ? variables.request.market?.accuracy
              : undefined;

          if (accuracy === QuoteAccuracy.Fast) {
            return msw.HttpResponse.json({
              data: {
                value: makeSwapByIntent({
                  quote: makeSwapQuote({
                    accuracy: QuoteAccuracy.Fast,
                  }),
                }),
              },
            });
          }

          // Track Accurate requests and return different values for each call
          const buyAmount = await new Promise<number>((r) => {
            releaseAccurateQuote = r;
          });
          // await delay(100); // Simulate network delay

          return msw.HttpResponse.json({
            data: {
              value: makeSwapByIntent({
                quote: makeSwapQuote({
                  accuracy: QuoteAccuracy.Accurate,
                  buyAmount,
                }),
              }),
            },
          });
        }),
      );
    });

    // Note: Only testing Market orders for Fast/Accurate quote behavior
    // Limit orders no longer have an accuracy field in the schema
    describe('And a token swap quote request', () => {
      const request: TokenSwapQuoteRequest = {
        market: {
          chainId: chainId(1),
          buy: {
            erc20: evmAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
          },
          sell: {
            erc20: evmAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
          },
          amount: bigDecimal(1000),
          kind: TokenSwapKind.Sell,
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
            useTokenSwapQuote(request),
          );

          await vi.waitUntil(() => result.current.loading === false);
          expect(result.current.data?.accuracy).toEqual(QuoteAccuracy.Fast);

          act(() => releaseAccurateQuote(42));

          await vi.waitUntil(
            () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
          );
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            42,
          );
        });
      });

      describe('When the first Accurate quote is received', () => {
        it('Then it should poll for fresh Accurate quotes every 30 seconds', async () => {
          const { result } = renderHookWithinContext(() =>
            useTokenSwapQuote(request),
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
    });
  });

  describe(`And using the '${useSupplySwapQuote.name}' hook`, () => {
    let releaseAccurateQuote: (value: number) => void;

    beforeEach(() => {
      server.use(
        api.query(SupplySwapQuoteQuery, async ({ variables }) => {
          const accuracy =
            'market' in variables.request
              ? variables.request.market?.accuracy
              : undefined;

          if (accuracy === QuoteAccuracy.Fast) {
            return msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'PositionSwapByIntentApprovalsRequired',
                  approvals: [],
                  quote: makeSwapQuote({
                    accuracy: QuoteAccuracy.Fast,
                  }),
                },
              },
            });
          }

          // Track Accurate requests and return different values for each call
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

    describe('And a supply swap quote request', () => {
      const request: SupplySwapQuoteRequest = {
        market: {
          sellPosition: makeUserSupplyItemId(),
          buyReserve: makeReserveId(),
          amount: bigDecimal(1000),
          user: evmAddress(walletClient.account.address),
          enableCollateral: true,
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
            useSupplySwapQuote(request),
          );

          await vi.waitUntil(() => result.current.loading === false);
          expect(result.current.data?.accuracy).toEqual(QuoteAccuracy.Fast);

          act(() => releaseAccurateQuote(42));

          await vi.waitUntil(
            () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
          );
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            42,
          );
        });
      });

      describe('When the first Accurate quote is received', () => {
        it('Then it should poll for fresh Accurate quotes every 30 seconds', async () => {
          const { result } = renderHookWithinContext(() =>
            useSupplySwapQuote(request),
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
    });
  });

  describe(`And using the '${useBorrowSwapQuote.name}' hook`, () => {
    let releaseAccurateQuote: (value: number) => void;

    beforeEach(() => {
      server.use(
        api.query(BorrowSwapQuoteQuery, async ({ variables }) => {
          const accuracy =
            'market' in variables.request
              ? variables.request.market?.accuracy
              : undefined;

          if (accuracy === QuoteAccuracy.Fast) {
            return msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'PositionSwapByIntentApprovalsRequired',
                  approvals: [],
                  quote: makeSwapQuote({
                    accuracy: QuoteAccuracy.Fast,
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

    describe('And a borrow swap quote request', () => {
      const request: BorrowSwapQuoteRequest = {
        market: {
          debtPosition: makeUserBorrowItemId(),
          buyReserve: makeReserveId(),
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
            useBorrowSwapQuote(request),
          );

          await vi.waitUntil(() => result.current.loading === false);
          expect(result.current.data?.accuracy).toEqual(QuoteAccuracy.Fast);

          act(() => releaseAccurateQuote(42));

          await vi.waitUntil(
            () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
          );
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            42,
          );
        });
      });

      describe('When the first Accurate quote is received', () => {
        it('Then it should poll for fresh Accurate quotes every 30 seconds', async () => {
          const { result } = renderHookWithinContext(() =>
            useBorrowSwapQuote(request),
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
    });
  });

  describe(`And using the '${useRepayWithSupplyQuote.name}' hook`, () => {
    let releaseAccurateQuote: (value: number) => void;

    beforeEach(() => {
      server.use(
        api.query(RepayWithSupplyQuoteQuery, async ({ variables }) => {
          const accuracy =
            'market' in variables.request
              ? variables.request.market?.accuracy
              : undefined;

          if (accuracy === QuoteAccuracy.Fast) {
            return msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'PositionSwapByIntentApprovalsRequired',
                  approvals: [],
                  quote: makeSwapQuote({
                    accuracy: QuoteAccuracy.Fast,
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
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            42,
          );
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
    });
  });

  describe(`And using the '${useWithdrawSwapQuote.name}' hook`, () => {
    let releaseAccurateQuote: (value: number) => void;

    beforeEach(() => {
      server.use(
        api.query(WithdrawSwapQuoteQuery, async ({ variables }) => {
          const accuracy =
            'market' in variables.request
              ? variables.request.market?.accuracy
              : undefined;

          if (accuracy === QuoteAccuracy.Fast) {
            return msw.HttpResponse.json({
              data: {
                value: {
                  __typename: 'PositionSwapByIntentApprovalsRequired',
                  approvals: [],
                  quote: makeSwapQuote({
                    accuracy: QuoteAccuracy.Fast,
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

    describe('And a withdraw swap quote request', () => {
      const request: WithdrawSwapQuoteRequest = {
        market: {
          sellPosition: makeUserSupplyItemId(),
          buyToken: { native: true },
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
            useWithdrawSwapQuote(request),
          );

          await vi.waitUntil(() => result.current.loading === false);
          expect(result.current.data?.accuracy).toEqual(QuoteAccuracy.Fast);

          act(() => releaseAccurateQuote(42));

          await vi.waitUntil(
            () => result.current.data?.accuracy === QuoteAccuracy.Accurate,
          );
          expect(result.current.data!.buy.amount.value).toBeBigDecimalEqualTo(
            42,
          );
        });
      });

      describe('When the first Accurate quote is received', () => {
        it('Then it should poll for fresh Accurate quotes every 30 seconds', async () => {
          const { result } = renderHookWithinContext(() =>
            useWithdrawSwapQuote(request),
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
    });
  });
});
