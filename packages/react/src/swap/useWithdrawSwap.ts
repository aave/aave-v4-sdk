import { preparePositionSwap, withdrawSwapQuote } from '@aave/client/actions';
import type { ValidationError } from '@aave/core';
import type {
  InsufficientBalanceError,
  InsufficientLiquidityError,
  SwapReceipt,
  WithdrawSwapQuoteRequest,
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

export type UseWithdrawSwapRequest = Prettify<
  WithdrawSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Orchestrate the withdraw swap execution plan.
 *
 * ```tsx
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [withdrawSwap, { loading, error }] = useWithdrawSwap((plan) => {
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
 * const result = await withdrawSwap({
 *   market: {
 *     position: userSupplyItem.id,
 *     buyToken: { erc20: evmAddress('0xA0b86a33E6…') },
 *     amount: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
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
export function useWithdrawSwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  WithdrawSwapQuoteRequest,
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
    }: UseWithdrawSwapRequest) => {
      return withdrawSwapQuote(client, request, { currency }).andThen(
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
