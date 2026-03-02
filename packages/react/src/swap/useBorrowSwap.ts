import { borrowSwapQuote, preparePositionSwap } from '@aave/client/actions';
import type { ValidationError } from '@aave/core';
import type {
  BorrowSwapQuoteRequest,
  InsufficientBalanceError,
  InsufficientLiquidityError,
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

export type UseBorrowSwapRequest = Prettify<
  BorrowSwapQuoteRequest & CurrencyQueryOptions
>;

/**
 * Orchestrate the borrow swap execution plan.
 *
 * ```tsx
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [swapBorrow, { loading, error }] = useBorrowSwap((plan) => {
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
 * const result = await swapBorrow({
 *   market: {
 *     debtPosition: userBorrowItem.id,
 *     buyReserve: targetReserve.id,
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
export function useBorrowSwap(
  handler: PositionSwapHandler,
): UseAsyncTask<
  BorrowSwapQuoteRequest,
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
    }: UseBorrowSwapRequest) => {
      return borrowSwapQuote(client, request, { currency }).andThen(
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
