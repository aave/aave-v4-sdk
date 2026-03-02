import { supportsPermit } from '@aave/client';
import { prepareTokenSwap, swap, tokenSwapQuote } from '@aave/client/actions';
import { UnexpectedError, type ValidationError } from '@aave/core';
import type {
  Erc20Approval,
  InsufficientBalanceError,
  InsufficientLiquidityError,
  SwapReceipt,
  SwapRequest,
  SwapTransactionRequest,
  SwapTypedData,
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
  okAsync,
  PendingTransaction,
  type SwapHandlerOptions,
  type SwapSignerError,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

export type UseTokenSwapRequest = Prettify<
  TokenSwapQuoteRequest & CurrencyQueryOptions
>;

export type TokenSwapPlan =
  | SwapTypedData
  | Erc20Approval
  | SwapTransactionRequest;

export type TokenSwapHandler = (
  plan: TokenSwapPlan,
  options: SwapHandlerOptions,
) => ResultAsync<PendingTransaction | Signature, SwapSignerError>;

/**
 * Orchestrate the token swap execution plan.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [swap, { loading, error }] = useTokenSwap((plan) => {
 *   switch (plan.__typename) {
 *     case 'Erc20Approval':
 *       if (plan.bySignature) {
 *         return signTypedData(plan.bySignature);
 *       }
 *       return sendTransaction(plan.byTransaction);
 *
 *     case 'SwapTransactionRequest':
 *       return sendTransaction(plan.transaction);
 *
 *     case 'SwapTypedData':
 *       return signTypedData(plan);
 *   }
 * });
 *
 * const result = await swap({
 *   fromQuote: {
 *     quoteId: quote.quoteId,
 *   },
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * // result.value: SwapReceipt
 * ```
 */
export function useTokenSwap(
  handler: TokenSwapHandler,
): UseAsyncTask<
  UseTokenSwapRequest,
  SwapReceipt,
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError | InsufficientLiquidityError>
> {
  const client = useAaveClient();

  const executeSwap = useCallback(
    (
      request: SwapRequest,
    ): ResultAsync<
      SwapReceipt,
      | SendTransactionError
      | PendingTransactionError
      | ValidationError<InsufficientBalanceError>
    > => {
      return swap(client, request).andThen((plan) => {
        switch (plan.__typename) {
          case 'SwapTransactionRequest':
            return handler(plan, { cancel })
              .andThen(PendingTransaction.tryFrom)
              .andThen((pendingTransaction) => pendingTransaction.wait())
              .andThen(() => okAsync(plan.orderReceipt));

          case 'SwapReceipt':
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
    }: UseTokenSwapRequest) =>
      tokenSwapQuote(client, request, { currency }).andThen((quoteResult) => {
        switch (quoteResult.__typename) {
          case 'SwapByTransaction':
            return executeSwap({
              transaction: { quoteId: quoteResult.quote.quoteId },
            });

          case 'SwapByIntent':
            return prepareTokenSwap(client, {
              quoteId: quoteResult.quote.quoteId,
            }).andThen((order) =>
              handler(order.data, { cancel })
                .andThen(trySignatureFrom)
                .andThen((signature) =>
                  executeSwap({
                    intent: { quoteId: order.newQuoteId, signature },
                  }),
                ),
            );

          case 'SwapByIntentWithApprovalRequired':
            if (supportsPermit(quoteResult)) {
              const approval = quoteResult.approvals[0];
              return handler(approval, { cancel })
                .andThen((result) => {
                  if (isSignature(result)) {
                    return prepareTokenSwap(client, {
                      quoteId: quoteResult.quote.quoteId,
                      permitSig: {
                        deadline: approval.bySignature.message
                          .deadline as number,
                        value: result,
                      },
                    });
                  }
                  if (PendingTransaction.isInstanceOf(result)) {
                    return result.wait().andThen(() =>
                      prepareTokenSwap(client, {
                        quoteId: quoteResult.quote.quoteId,
                      }),
                    );
                  }
                  return UnexpectedError.from(result).asResultAsync();
                })
                .andThen((order) =>
                  handler(order.data, { cancel })
                    .andThen(trySignatureFrom)
                    .andThen((signature) =>
                      executeSwap({
                        intent: {
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
                prepareTokenSwap(client, {
                  quoteId: quoteResult.quote.quoteId,
                }),
              )
              .andThen((order) => handler(order.data, { cancel }))
              .andThen(trySignatureFrom)
              .andThen((signature) =>
                executeSwap({
                  intent: { quoteId: quoteResult.quote.quoteId, signature },
                }),
              );
          default:
            never(
              `Unsupported swap quote result: ${quoteResult.__typename}. To be removed from API soon.`,
            );
        }
      }),
    [client, handler, executeSwap],
  );
}
