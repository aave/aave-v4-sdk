import { prepareOrder, supplySwapQuote } from '@aave/client/actions';
import type { ValidationError } from '@aave/core';
import type {
  InsufficientBalanceError,
  InsufficientLiquidityError,
  OrderReceipt,
  SupplySwapQuoteRequest,
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

export type UseSupplySwapOrderRequest = Prettify<
  SupplySwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Execute a supply swap through the Order API.
 *
 * The Order-API equivalent of {@link useSupplySwap}: it fetches a supply swap
 * quote, collects the position-swap approval signatures, prepares and signs the
 * order, then submits it — resolving to an {@link OrderReceipt}.
 *
 * ```tsx
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [swapSupply, { loading, error }] = useSupplySwapOrder((plan) => {
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
 *
 * const result = await swapSupply({
 *   market: {
 *     sellPosition: supplyPosition.id,
 *     buyReserve: targetReserve.id,
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
 *     enableCollateral: true,
 *   },
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * // result.value: OrderReceipt
 * ```
 */
export function useSupplySwapOrder(
  handler: PositionOrderHandler,
): UseAsyncTask<
  UseSupplySwapOrderRequest,
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
    }: UseSupplySwapOrderRequest) => {
      return supplySwapQuote(client, request, { currency }).andThen((result) =>
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
