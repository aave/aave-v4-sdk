import {
  delay,
  TimeoutError,
  UnexpectedError,
  ValidationError,
} from '@aave/core';
import {
  type CancelOrderExecutionPlan,
  CancelOrderMutation,
  type CancelOrderRequest,
  type InsufficientBalanceError,
  type InsufficientLiquidityError,
  type LeverageApprovalsRequired,
  LeverageQuoteQuery,
  type LeverageQuoteRequest,
  type OrderCancelled,
  type OrderExpired,
  type OrderFulfilled,
  type OrderReceipt,
  type OrderStatus,
  OrderStatusQuery,
  type OrderStatusRequest,
  type OrderTransactionRequest,
  type PaginatedOrdersResult,
  PendingOrdersQuery,
  type PendingOrdersRequest,
  PrepareCancelOrderQuery,
  type PrepareCancelOrderRequest,
  type PrepareCancelOrderResult,
  type PreparedOrder,
  PrepareOrderQuery,
  type PrepareOrderRequest,
  SubmitOrderMutation,
  type SubmitOrderRequest,
} from '@aave/graphql';
import { extendWithOpaqueType, okAsync, ResultAsync } from '@aave/types';
import type { AaveClient } from '../AaveClient';
import {
  type CurrencyQueryOptions,
  DEFAULT_QUERY_OPTIONS,
  type RequestPolicyOptions,
  type TimeWindowQueryOptions,
} from '../options';

/**
 * Fetches a leverage quote for opening or increasing a leveraged position.
 *
 * ```ts
 * const result = await leverageQuote(client, {
 *   market: {
 *     debtReserve: reserveId('reserve_123'),
 *     collateralReserve: reserveId('reserve_456'),
 *     multiplier: bigDecimal('2.5'),
 *     additionalCollateral: bigDecimal('1000'),
 *     user: evmAddress('0x742d35cc...'),
 *   },
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The leverage quote request parameters.
 * @param options - The query options.
 * @returns The leverage quote with approvals and the maximum safe multiplier.
 */
export function leverageQuote(
  client: AaveClient,
  request: LeverageQuoteRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions & RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<
  LeverageApprovalsRequired,
  UnexpectedError | ValidationError<InsufficientLiquidityError>
> {
  return client
    .query(
      LeverageQuoteQuery,
      { request, currency },
      { batch: false, requestPolicy },
    )
    .map(extendWithOpaqueType)
    .andThen((result) => {
      switch (result.__typename) {
        case 'LeverageApprovalsRequired':
          return okAsync(result);

        case 'InsufficientLiquidityError':
          return ValidationError.fromGqlNode(result).asResultAsync();

        default:
          return UnexpectedError.upgradeRequired(
            `Unsupported result: ${result.__typename}`,
          ).asResultAsync();
      }
    });
}

/**
 * Prepares an order by obtaining the typed data for signing.
 *
 * Dispatches on the quote's product, so it works for token swaps, position
 * swaps, and leverage alike.
 *
 * ```ts
 * const result = await prepareOrder(client, {
 *   quoteId: quote.quoteId,
 *   adapterContractSignature: signature('0x456...'),
 *   positionManagerSignature: signature('0x789...'),
 * }).andThen((order) => {
 *   return signTypedDataWith(wallet, order.data)
 *     .andThen((signature) =>
 *       submitOrder(client, {
 *         bySignature: { quoteId: order.newQuoteId, signature },
 *       }),
 *     );
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The prepare order request with quote ID and signatures.
 * @returns The prepared order containing the typed data to sign.
 */
export function prepareOrder(
  client: AaveClient,
  request: PrepareOrderRequest,
): ResultAsync<
  PreparedOrder,
  ValidationError<InsufficientBalanceError> | UnexpectedError
> {
  return client
    .query(PrepareOrderQuery, { request }, { batch: false })
    .map(extendWithOpaqueType)
    .andThen((result) => {
      switch (result.__typename) {
        case 'PreparedOrder':
          return okAsync(result);
        case 'InsufficientBalanceError':
          return ValidationError.fromGqlNode(result).asResultAsync();
        default:
          return UnexpectedError.upgradeRequired(
            `Unsupported result: ${result.__typename}`,
          ).asResultAsync();
      }
    });
}

/**
 * Fetches the status of a specific order.
 *
 * ```ts
 * const result = await orderStatus(client, {
 *   id: orderId('0x123...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The order status request parameters.
 * @param options - The query options.
 * @returns The current status of the order.
 */
export function orderStatus(
  client: AaveClient,
  request: OrderStatusRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<OrderStatus | null, UnexpectedError> {
  return client.query(
    OrderStatusQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}

export type OrderOutcome = OrderCancelled | OrderExpired | OrderFulfilled;

/**
 * Waits for an order to reach a final outcome (cancelled, expired, or fulfilled).
 *
 * ```ts
 * const result = await waitForOrderOutcome(client)(orderReceipt);
 *
 * if (result.isOk()) {
 *   const outcome = result.value;
 *   switch (outcome.__typename) {
 *     case 'OrderFulfilled':
 *       console.log('Order completed successfully:', outcome.txHash);
 *       break;
 *     case 'OrderCancelled':
 *       console.log('Order was cancelled:', outcome.cancelledAt);
 *       break;
 *     case 'OrderExpired':
 *       console.log('Order expired:', outcome.expiredAt);
 *       break;
 *   }
 * }
 * ```
 *
 * @param client - Aave client configured with polling settings.
 * @returns A function that takes an OrderReceipt and returns a ResultAsync with the final outcome.
 */
export function waitForOrderOutcome(
  client: AaveClient,
): (
  receipt: OrderReceipt,
) => ResultAsync<OrderOutcome, TimeoutError | UnexpectedError> {
  return (receipt: OrderReceipt) => {
    const pollForOrderOutcome = async (
      request: OrderStatusRequest,
    ): Promise<OrderOutcome> => {
      const startedAt = Date.now();

      while (
        Date.now() - startedAt <
        client.context.environment.indexingTimeout
      ) {
        const status = await orderStatus(client, request).match(
          (ok) => ok,
          (err) => {
            throw err;
          },
        );

        switch (status?.__typename) {
          case 'OrderCancelled':
          case 'OrderExpired':
          case 'OrderFulfilled':
            return status;

          default:
            await delay(client.context.environment.pollingInterval);
            continue;
        }
      }

      throw TimeoutError.from(
        `Timeout waiting for order ${request.id} to reach final outcome.`,
      );
    };

    return ResultAsync.fromPromise(
      pollForOrderOutcome({ id: receipt.orderId }),
      (error) => {
        if (error instanceof TimeoutError || error instanceof UnexpectedError) {
          return error;
        }
        return UnexpectedError.from(error);
      },
    );
  };
}

/**
 * Submits an order for the specified request parameters.
 *
 * ```ts
 * const result = await submitOrder(client, {
 *   bySignature: {
 *     quoteId: order.newQuoteId,
 *     signature: signature('0x456...'),
 *   },
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'OrderTransactionRequest':
 *       return sendTransaction(plan.transaction)
 *         .map(() => plan.orderReceipt);
 *
 *     case 'OrderReceipt':
 *       return okAsync(plan);
 *   }
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Order receipt:', result.value);
 * ```
 *
 * @param client - Aave client.
 * @param request - The submit order request parameters.
 * @returns The order execution plan containing transaction details or receipt.
 */
export function submitOrder(
  client: AaveClient,
  request: SubmitOrderRequest,
): ResultAsync<
  OrderTransactionRequest | OrderReceipt,
  ValidationError<InsufficientBalanceError> | UnexpectedError
> {
  return client
    .mutation(SubmitOrderMutation, { request })
    .map(extendWithOpaqueType)
    .andThen((plan) => {
      switch (plan.__typename) {
        case 'OrderTransactionRequest':
          return okAsync(plan);
        case 'OrderReceipt':
          return okAsync(plan);
        case 'InsufficientBalanceError':
          return ValidationError.fromGqlNode(plan).asResultAsync();
        default:
          return UnexpectedError.upgradeRequired(
            `Unsupported order plan: ${plan.__typename}`,
          ).asResultAsync();
      }
    });
}

/**
 * Prepares an order cancellation for the specified order ID.
 *
 * ```ts
 * const result = await prepareCancelOrder(client, {
 *   id: orderId('0x123...'),
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The prepare cancel order request parameters.
 * @returns The prepared cancellation containing typed data for signing.
 */
export function prepareCancelOrder(
  client: AaveClient,
  request: PrepareCancelOrderRequest,
): ResultAsync<PrepareCancelOrderResult, UnexpectedError> {
  return client.query(PrepareCancelOrderQuery, { request }, { batch: false });
}

/**
 * Cancels an order for the specified request parameters.
 *
 * ```ts
 * const result = await cancelOrder(client, {
 *   bySignature: {
 *     id: orderId('0x123...'),
 *     signature: signature('0x456...'),
 *   },
 * }).andThen((plan) => {
 *   switch (plan.__typename) {
 *     case 'TransactionRequest':
 *       return sendTransaction(plan);
 *
 *     case 'OrderCancelledResult':
 *       return okAsync(plan);
 *   }
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The cancel order request parameters.
 * @returns The cancel order execution plan containing transaction details or cancellation receipt.
 */
export function cancelOrder(
  client: AaveClient,
  request: CancelOrderRequest,
): ResultAsync<CancelOrderExecutionPlan, UnexpectedError> {
  return client.mutation(CancelOrderMutation, { request });
}

/**
 * Fetches the user's pending orders for a specific chain.
 *
 * ```ts
 * const result = await pendingOrders(client, {
 *   chainId: chainId(1),
 *   user: evmAddress('0x742d35cc...'),
 *   filterBy: [OrderStatusFilter.Fulfilled, OrderStatusFilter.Open],
 * });
 * ```
 *
 * @param client - Aave client.
 * @param request - The pending orders request parameters.
 * @param options - The query options.
 * @returns The paginated list of orders with their status information.
 */
export function pendingOrders(
  client: AaveClient,
  request: PendingOrdersRequest,
  {
    currency = DEFAULT_QUERY_OPTIONS.currency,
    timeWindow = DEFAULT_QUERY_OPTIONS.timeWindow,
    requestPolicy = DEFAULT_QUERY_OPTIONS.requestPolicy,
  }: CurrencyQueryOptions &
    TimeWindowQueryOptions &
    RequestPolicyOptions = DEFAULT_QUERY_OPTIONS,
): ResultAsync<PaginatedOrdersResult, UnexpectedError> {
  return client.query(
    PendingOrdersQuery,
    { request, currency, timeWindow },
    { requestPolicy },
  );
}
