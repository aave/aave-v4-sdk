import { supportsPermit } from '@aave/client';
import {
  prepareOrder,
  submitOrder,
  tokenSwapQuote,
} from '@aave/client/actions';
import { UnexpectedError, type ValidationError } from '@aave/core';
import type {
  Erc20Approval,
  InsufficientBalanceError,
  InsufficientLiquidityError,
  OrderReceipt,
  OrderTransactionRequest,
  OrderTypedData,
  SubmitOrderRequest,
  TokenSwapQuoteRequest,
} from '@aave/graphql';
import type { Prettify, ResultAsync, Signature } from '@aave/types';
import { never } from '@aave/types';
import { useCallback } from 'react';

import { useAaveClient } from '../context';
import type { PendingTransactionError, SendTransactionError } from '../helpers';

import {
  type CurrencyQueryOptions,
  cancel,
  DEFAULT_QUERY_OPTIONS,
  isSignature,
  type OrderHandlerOptions,
  type OrderSignerError,
  okAsync,
  PendingTransaction,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

export type UseTokenSwapOrderRequest = Prettify<
  TokenSwapQuoteRequest & CurrencyQueryOptions
>;

export type TokenSwapOrderPlan =
  | OrderTypedData
  | Erc20Approval
  | OrderTransactionRequest;

export type TokenSwapOrderHandler = (
  plan: TokenSwapOrderPlan,
  options: OrderHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, OrderSignerError>;

/**
 * Execute a token swap through the Order API.
 *
 * The Order-API equivalent of {@link useTokenSwap}: it fetches a token swap
 * quote and, depending on the quote variant, either submits a transaction or
 * prepares, signs, and submits an intent — handling any required ERC-20
 * approval first — resolving to an {@link OrderReceipt}.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [swapTokens, { loading, error }] = useTokenSwapOrder((plan) => {
 *   switch (plan.__typename) {
 *     case 'Erc20Approval':
 *       return plan.bySignature
 *         ? signTypedData(plan.bySignature)
 *         : sendTransaction(plan.transaction);
 *
 *     case 'OrderTransactionRequest':
 *       return sendTransaction(plan.transaction);
 *
 *     case 'OrderTypedData':
 *       return signTypedData(plan);
 *   }
 * });
 * ```
 */
export function useTokenSwapOrder(
  handler: TokenSwapOrderHandler,
): UseAsyncTask<
  UseTokenSwapOrderRequest,
  OrderReceipt,
  | OrderSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError | InsufficientLiquidityError>
> {
  const client = useAaveClient();

  const executeOrder = useCallback(
    (
      request: SubmitOrderRequest,
    ): ResultAsync<
      OrderReceipt,
      | SendTransactionError
      | PendingTransactionError
      | ValidationError<InsufficientBalanceError>
    > => {
      return submitOrder(client, request).andThen((plan) => {
        switch (plan.__typename) {
          case 'OrderTransactionRequest':
            return handler(plan, { cancel })
              .andThen(PendingTransaction.tryFrom)
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => okAsync(plan.orderReceipt));

          case 'OrderReceipt':
            return okAsync(plan);
        }
      });
    },
    [client, handler],
  );

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseTokenSwapOrderRequest) =>
      tokenSwapQuote(client, request, { currency }).andThen((quoteResult) => {
        switch (quoteResult.__typename) {
          case 'SwapByTransaction':
            return executeOrder({
              byTransaction: { quoteId: quoteResult.quote.orderQuoteId },
            });

          case 'SwapByIntent':
            return prepareOrder(client, {
              quoteId: quoteResult.quote.orderQuoteId,
            }).andThen((order) =>
              handler(order.data, { cancel })
                .andThen(trySignatureFrom)
                .andThen((signature) =>
                  executeOrder({
                    bySignature: { quoteId: order.newQuoteId, signature },
                  }),
                ),
            );

          case 'SwapByIntentWithApprovalRequired':
            if (supportsPermit(quoteResult)) {
              const approval = quoteResult.approvals[0];
              return handler(approval, { cancel })
                .andThen((result) => {
                  if (isSignature(result)) {
                    return prepareOrder(client, {
                      quoteId: quoteResult.quote.orderQuoteId,
                      permitSig: {
                        deadline: approval.bySignature.message
                          .deadline as number,
                        value: result,
                      },
                    });
                  }
                  if (PendingTransaction.isInstanceOf(result)) {
                    return result.wait().andThen(() =>
                      prepareOrder(client, {
                        quoteId: quoteResult.quote.orderQuoteId,
                      }),
                    );
                  }
                  return UnexpectedError.from(result).asResultAsync();
                })
                .andThen((order) =>
                  handler(order.data, { cancel })
                    .andThen(trySignatureFrom)
                    .andThen((signature) =>
                      executeOrder({
                        bySignature: {
                          quoteId: order.newQuoteId,
                          signature,
                        },
                      }),
                    ),
                );
            }

            return quoteResult.approvals
              .reduce(
                (chain, approval) =>
                  chain.andThen(() =>
                    handler({ ...approval, bySignature: null }, { cancel })
                      .andThen(PendingTransaction.tryFrom)
                      .andThen((pendingTransaction) =>
                        pendingTransaction.wait(),
                      ),
                  ),
                okAsync(undefined) as ResultAsync<
                  unknown,
                  SendTransactionError | PendingTransactionError
                >,
              )
              .andThen(() =>
                prepareOrder(client, {
                  quoteId: quoteResult.quote.orderQuoteId,
                }),
              )
              .andThen((order) =>
                handler(order.data, { cancel })
                  .andThen(trySignatureFrom)
                  .andThen((signature) =>
                    executeOrder({
                      bySignature: { quoteId: order.newQuoteId, signature },
                    }),
                  ),
              );

          case 'SwapByTransactionWithApprovalRequired':
            return quoteResult.approvals
              .reduce(
                (chain, approval) =>
                  chain.andThen(() =>
                    handler({ ...approval, bySignature: null }, { cancel })
                      .andThen(PendingTransaction.tryFrom)
                      .andThen((pendingTransaction) =>
                        pendingTransaction.wait(),
                      ),
                  ),
                okAsync(undefined) as ResultAsync<
                  unknown,
                  SendTransactionError | PendingTransactionError
                >,
              )
              .andThen(() =>
                executeOrder({
                  byTransaction: { quoteId: quoteResult.quote.orderQuoteId },
                }),
              );

          default:
            never(
              `Unsupported token swap quote result: ${quoteResult.__typename}.`,
            );
        }
      }),
    [client, handler, executeOrder],
  );
}
