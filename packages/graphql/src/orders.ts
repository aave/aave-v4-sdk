import type { FragmentOf } from 'gql.tada';
import type { Currency, TimeWindow } from './enums';
import {
  CancelOrderExecutionPlanFragment,
  LeverageQuoteResultFragment,
  OrderExecutionPlanFragment,
  OrderStatusFragment,
  PaginatedOrdersResultFragment,
  PrepareCancelOrderResultFragment,
  PrepareOrderResultFragment,
} from './fragments';
import { graphql, type QueryDocumentFor, type RequestOf } from './graphql';

/**
 * @internal
 */
export const LeverageQuoteQuery = graphql(
  `query LeverageQuote($request: LeverageQuoteRequest!, $currency: Currency!) {
    value: leverageQuote(request: $request) {
      ...LeverageQuoteResult
    }
  }`,
  [LeverageQuoteResultFragment],
);
export type LeverageQuoteRequest = RequestOf<typeof LeverageQuoteQuery>;

export type MarketLeverageQuoteInput = ReturnType<
  typeof graphql.scalar<'MarketLeverageQuoteInput'>
>;
export type LimitLeverageQuoteInput = ReturnType<
  typeof graphql.scalar<'LimitLeverageQuoteInput'>
>;
export type FromQuoteLeverageQuoteInput = ReturnType<
  typeof graphql.scalar<'FromQuoteLeverageQuoteInput'>
>;

/**
 * @internal
 */
export const PrepareOrderQuery = graphql(
  `query PrepareOrder($request: PrepareOrderRequest!) {
    value: prepareOrder(request: $request) {
      ...PrepareOrderResult
    }
  }`,
  [PrepareOrderResultFragment],
);
export type PrepareOrderRequest = RequestOf<typeof PrepareOrderQuery>;

export type OrderStatusRequest = ReturnType<
  typeof graphql.scalar<'OrderStatusRequest'>
>;

/**
 * @internal
 */
export const OrderStatusQuery: QueryDocumentFor<
  FragmentOf<typeof OrderStatusFragment> | null,
  { request: OrderStatusRequest; currency: Currency; timeWindow: TimeWindow }
> = graphql(
  `query OrderStatus($request: OrderStatusRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: orderStatus(request: $request) {
      ...OrderStatus
    }
  }`,
  [OrderStatusFragment],
);

export type PendingOrdersRequest = ReturnType<
  typeof graphql.scalar<'PendingOrdersRequest'>
>;

/**
 * @internal
 */
export const PendingOrdersQuery: QueryDocumentFor<
  FragmentOf<typeof PaginatedOrdersResultFragment>,
  { request: PendingOrdersRequest; currency: Currency; timeWindow: TimeWindow }
> = graphql(
  `query PendingOrders($request: PendingOrdersRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: pendingOrders(request: $request) {
      ...PaginatedOrdersResult
    }
  }`,
  [PaginatedOrdersResultFragment],
);

/**
 * @internal
 */
export const PrepareCancelOrderQuery = graphql(
  `query PrepareCancelOrder($request: PrepareCancelOrderRequest!) {
    value: prepareCancelOrder(request: $request) {
      ...PrepareCancelOrderResult
    }
  }`,
  [PrepareCancelOrderResultFragment],
);
export type PrepareCancelOrderRequest = RequestOf<
  typeof PrepareCancelOrderQuery
>;

/**
 * @internal
 */
export const SubmitOrderMutation = graphql(
  `mutation SubmitOrder($request: SubmitOrderRequest!) {
    value: submitOrder(request: $request) {
      ...OrderExecutionPlan
    }
  }`,
  [OrderExecutionPlanFragment],
);
export type SubmitOrderRequest = RequestOf<typeof SubmitOrderMutation>;

export type SubmitOrderBySignatureInput = ReturnType<
  typeof graphql.scalar<'SubmitOrderBySignatureInput'>
>;
export type SubmitOrderByTransactionInput = ReturnType<
  typeof graphql.scalar<'SubmitOrderByTransactionInput'>
>;

/**
 * @internal
 */
export const CancelOrderMutation = graphql(
  `mutation CancelOrder($request: CancelOrderRequest!) {
    value: cancelOrder(request: $request) {
      ...CancelOrderExecutionPlan
    }
  }`,
  [CancelOrderExecutionPlanFragment],
);
export type CancelOrderRequest = RequestOf<typeof CancelOrderMutation>;

export type CancelOrderBySignatureInput = ReturnType<
  typeof graphql.scalar<'CancelOrderBySignatureInput'>
>;
