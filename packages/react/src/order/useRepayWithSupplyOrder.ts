import { prepareOrder, repayWithSupplyQuote } from '@aave/client/actions';
import type { ValidationError } from '@aave/core';
import type {
  InsufficientBalanceError,
  InsufficientLiquidityError,
  OrderReceipt,
  RepayWithSupplyQuoteRequest,
} from '@aave/graphql';
import type { Prettify } from '@aave/types';

import { useAaveClient } from '../context';
import type { PendingTransactionError, SendTransactionError } from '../helpers';

import {
  type CurrencyQueryOptions,
  cancel,
  DEFAULT_QUERY_OPTIONS,
  type OrderSignerError,
  type PositionOrderHandler,
  processPositionOrderApprovals,
  submitOrderIntent,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

export type UseRepayWithSupplyOrderRequest = Prettify<
  RepayWithSupplyQuoteRequest & CurrencyQueryOptions
>;

/**
 * Execute a repay-with-supply swap through the Order API.
 *
 * The Order-API equivalent of {@link useRepayWithSupply}: it fetches a
 * repay-with-supply quote, collects the position-swap approval signatures,
 * prepares and signs the order, then submits it — resolving to an
 * {@link OrderReceipt}.
 *
 * ```tsx
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [repayWithSupply, { loading, error }] = useRepayWithSupplyOrder((plan) => {
 *   switch (plan.__typename) {
 *     case 'PositionSwapAdapterContractApproval':
 *     case 'PositionSwapPositionManagerApproval':
 *     case 'PositionSwapSetCollateralApproval':
 *       return signTypedData(plan.bySignature);
 *
 *     case 'OrderTypedData':
 *       return signTypedData(plan);
 *   }
 * });
 * ```
 */
export function useRepayWithSupplyOrder(
  handler: PositionOrderHandler,
): UseAsyncTask<
  UseRepayWithSupplyOrderRequest,
  OrderReceipt,
  | OrderSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError | InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseRepayWithSupplyOrderRequest) => {
      return repayWithSupplyQuote(client, request, { currency }).andThen(
        (result) =>
          processPositionOrderApprovals(result)
            .with(handler)
            .andThen((request) => prepareOrder(client, request))
            .andThen((order) =>
              handler(order.data, { cancel })
                .andThen(trySignatureFrom)
                .andThen((signature) =>
                  submitOrderIntent(client, {
                    quoteId: order.newQuoteId,
                    signature,
                  }),
                ),
            ),
      );
    },
    [client, handler],
  );
}
