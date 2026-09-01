import { leverageQuote, prepareOrder } from '@aave/client/actions';
import type { ValidationError } from '@aave/core';
import type {
  ERC20PermitSignature,
  InsufficientBalanceError,
  InsufficientLiquidityError,
  LeverageQuoteRequest,
  OrderReceipt,
} from '@aave/graphql';
import type { Prettify } from '@aave/types';

import { useAaveClient } from '../context';
import type { PendingTransactionError, SendTransactionError } from '../helpers';

import {
  type CurrencyQueryOptions,
  cancel,
  DEFAULT_QUERY_OPTIONS,
  type OrderHandler,
  type OrderSignerError,
  processOrderApprovals,
  submitOrderIntent,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

export type UseLeverageRequest = Prettify<
  LeverageQuoteRequest &
    CurrencyQueryOptions & {
      /**
       * Pre-built EIP-2612 permit over the collateral token for a wallet
       * top-up via `additionalCollateral`.
       *
       * Normally unnecessary: the server returns an `OrderErc20Approval` for
       * the top-up and the handler's signature becomes the permit. When it
       * does, that signature takes precedence over this value.
       */
      permitSig?: ERC20PermitSignature | null;
    }
>;

/**
 * Orchestrate the leverage execution plan.
 *
 * Flash-loans the debt asset, swaps it into the collateral asset, supplies the
 * collateral, then borrows the debt to repay the flash loan.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [leverage, { loading, error }] = useLeverage((plan) => {
 *   switch (plan.__typename) {
 *     case 'OrderAdapterApproval':
 *     case 'OrderPositionManagerApproval':
 *     case 'OrderSetCollateralApproval':
 *       return signTypedData(plan.bySignature);
 *
 *     case 'OrderErc20Approval':
 *       return plan.byPermit
 *         ? signTypedData(plan.byPermit)
 *         : sendTransaction(plan.byTransaction);
 *
 *     case 'OrderTypedData':
 *       return signTypedData(plan);
 *
 *     case 'OrderTransactionRequest':
 *       return sendTransaction(plan.transaction);
 *   }
 * });
 *
 * const result = await leverage({
 *   market: {
 *     debtReserve: debtReserve.id,
 *     collateralReserve: collateralReserve.id,
 *     multiplier: bigDecimal('2.5'),
 *     additionalCollateral: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc…'),
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
export function useLeverage(
  handler: OrderHandler,
): UseAsyncTask<
  UseLeverageRequest,
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
      permitSig = null,
      ...request
    }: UseLeverageRequest) => {
      return leverageQuote(client, request, { currency }).andThen((result) => {
        return processOrderApprovals(result, permitSig)
          .with(handler)
          .andThen((request) => prepareOrder(client, request))
          .andThen((order) =>
            handler(order.data, { cancel })
              .andThen(trySignatureFrom)
              .andThen((signature) =>
                submitOrderIntent(
                  client,
                  { quoteId: order.newQuoteId, signature },
                  handler,
                ),
              ),
          );
      });
    },
    [client, handler],
  );
}
