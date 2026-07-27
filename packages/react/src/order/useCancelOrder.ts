import {
  cancelOrder,
  orderStatus,
  prepareCancelOrder,
} from '@aave/client/actions';
import {
  type CancelError,
  type SigningError,
  type TimeoutError,
  type TransactionError,
  UnexpectedError,
} from '@aave/core';
import type {
  OrderCancelled,
  OrderCancelledResult,
  OrderTypedData,
  PrepareCancelOrderRequest,
  TransactionRequest,
} from '@aave/graphql';
import type { ResultAsync, Signature } from '@aave/types';
import { ResultAwareError } from '@aave/types';

import { useAaveClient } from '../context';

import {
  cancel,
  type OrderSignerError,
  okAsync,
  PendingTransaction,
  trySignatureFrom,
  type UseAsyncTask,
  useAsyncTask,
} from './helpers';

function toOrderCancelledResult(
  cancelled: OrderCancelled,
): OrderCancelledResult {
  return {
    __typename: 'OrderCancelledResult',
    orderId: cancelled.orderId,
  };
}

export type CancelOrderHandler = (
  data: OrderTypedData | TransactionRequest,
  options: { cancel: typeof cancel },
) => ResultAsync<PendingTransaction | Signature, OrderSignerError>;

export class CannotCancelOrderError extends ResultAwareError {
  name = 'CannotCancelOrderError' as const;
}

export type CancelOrderError =
  | CancelError
  | CannotCancelOrderError
  | SigningError
  | TimeoutError
  | TransactionError
  | UnexpectedError;

/**
 * Executes the complete order cancellation workflow combining preparation and execution.
 *
 * ```tsx
 * const [sendTransaction] = useSendTransaction(wallet);
 * const [signTypedData] = useSignTypedData(wallet);
 *
 * const [cancelOrder, { loading, error }] = useCancelOrder((plan) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'OrderTypedData':
 *       return signTypedData(plan);
 *   }
 * });
 *
 * const result = await cancelOrder({
 *   id: orderId('0x123…'),
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * // result.value: OrderCancelledResult
 * console.log('Order cancelled:', result.value);
 * ```
 */
export function useCancelOrder(
  handler: CancelOrderHandler,
): UseAsyncTask<
  PrepareCancelOrderRequest,
  OrderCancelledResult,
  CancelOrderError
> {
  const client = useAaveClient();

  return useAsyncTask(
    (request) =>
      orderStatus(client, { id: request.id }).andThen((status) => {
        if (status === null) {
          return UnexpectedError.from('Order not found').asResultAsync();
        }

        switch (status.__typename) {
          case 'OrderOpen':
          case 'OrderPendingSignature':
            return prepareCancelOrder(client, request)
              .andThen((result) => handler(result.data, { cancel }))
              .andThen(trySignatureFrom)
              .andThen((signature) =>
                cancelOrder(client, {
                  bySignature: { id: request.id, signature },
                }),
              )
              .andThen((plan) => {
                if (plan.__typename === 'OrderCancelledResult') {
                  return okAsync(plan);
                }

                return handler(plan, { cancel })
                  .andThen(PendingTransaction.tryFrom)
                  .andThen((pendingTransaction) => pendingTransaction.wait())
                  .andThen(() => orderStatus(client, { id: request.id }))
                  .andThen((status) => {
                    if (status?.__typename === 'OrderCancelled') {
                      return okAsync(toOrderCancelledResult(status));
                    }
                    return new CannotCancelOrderError(
                      'Failed to cancel order',
                    ).asResultAsync();
                  });
              });

          case 'OrderCancelled':
            return okAsync(toOrderCancelledResult(status));

          case 'OrderExpired':
            return new CannotCancelOrderError(
              'Order cannot longer be cancelled',
            ).asResultAsync();

          default:
            return UnexpectedError.upgradeRequired(
              `Unsupported order status: ${status.__typename}`,
            ).asResultAsync();
        }
      }),
    [client, handler],
  );
}
