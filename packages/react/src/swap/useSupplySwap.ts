import { preparePositionSwap, supplySwapQuote } from '@aave/client/actions';
import type { ValidationError } from '@aave/core';
import type {
  InsufficientBalanceError,
  InsufficientLiquidityError,
  SupplySwapQuoteRequest,
  SwapReceipt,
} from '@aave/graphql';
import type { Prettify } from '@aave/types';

import { useAaveClient } from '../context';
import type { PendingTransactionError, SendTransactionError } from '../helpers';

import {
  type CurrencyQueryOptions,
  cancel,
  DEFAULT_QUERY_OPTIONS,
  type PositionSwapHandler,
  processApprovals,
  type SwapSignerError,
  swapPosition,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

export type UseSupplySwapRequest = Prettify<
  SupplySwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Orchestrate the supply swap execution plan.
 *
 * ```tsx
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [swapSupply, { loading, error }] = useSupplySwap((plan) => {
 *   switch (plan.__typename) {
 *     case 'PositionSwapAdapterContractApproval':
 *     case 'PositionSwapPositionManagerApproval':
 *       return signTypedData(plan.bySignature);
 *
 *     case 'SwapTypedData':
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
 * // result.value: SwapReceipt
 * ```
 */
export function useSupplySwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  SupplySwapQuoteRequest,
  SwapReceipt,
  | SwapSignerError
  | SendTransactionError
  | PendingTransactionError
  | ValidationError<InsufficientBalanceError | InsufficientLiquidityError>
> {
  const client = useAaveClient();

  return useAsyncTask(
    ({
      currency = DEFAULT_QUERY_OPTIONS.currency,
      ...request
    }: UseSupplySwapRequest) => {
      return supplySwapQuote(client, request, { currency }).andThen(
        (result) => {
          return processApprovals(result)
            .with(handler)
            .andThen((request) => preparePositionSwap(client, request))
            .andThen((order) =>
              handler(order.data, { cancel })
                .andThen(trySignatureFrom)
                .andThen((signature) =>
                  swapPosition(client, {
                    quoteId: order.newQuoteId,
                    signature,
                  }),
                ),
            );
        },
      );
    },
    [client, handler],
  );
}
