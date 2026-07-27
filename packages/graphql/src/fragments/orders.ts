import type { ExtendWithOpaqueType } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  DomainDataFragment,
  InsufficientBalanceErrorFragment,
  InsufficientLiquidityErrorFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  TokenAmountFragment,
} from './common';
import {
  type BorrowSwap,
  BorrowSwapFragment,
  type Leverage,
  LeverageFragment,
  type RepayWithSupply,
  RepayWithSupplyFragment,
  type SupplySwap,
  SupplySwapFragment,
  SwapTypedDataFragment,
  type TokenSwap,
  TokenSwapFragment,
  type WithdrawSwap,
  WithdrawSwapFragment,
} from './swaps';
import {
  type TransactionRequest,
  TransactionRequestFragment,
} from './transactions';

export const OrderQuoteCostsFragment = graphql(
  `fragment OrderQuoteCosts on OrderQuoteCosts {
    __typename
    networkCosts {
      ...TokenAmount
    }
    partnerFee {
      ...TokenAmount
    }
    flashloanFee {
      ...TokenAmount
    }
    providerFee {
      ...TokenAmount
    }
  }`,
  [TokenAmountFragment],
);
export type OrderQuoteCosts = FragmentOf<typeof OrderQuoteCostsFragment>;

export const OrderQuoteFragment = graphql(
  `fragment OrderQuote on OrderQuote {
    __typename
    accuracy
    quoteId
    suggestedSlippage {
      ...PercentNumber
    }
    selectedSlippage {
      ...PercentNumber
    }
    buy {
      ...TokenAmount
    }
    sell {
      ...TokenAmount
    }
    costs {
      ...OrderQuoteCosts
    }
    finalBuy {
      ...TokenAmount
    }
    finalSell {
      ...TokenAmount
    }
    kind
    class
  }`,
  [PercentNumberFragment, TokenAmountFragment, OrderQuoteCostsFragment],
);
export type OrderQuote = FragmentOf<typeof OrderQuoteFragment>;

export const OrderTypedDataFragment = graphql(
  `fragment OrderTypedData on OrderTypedData {
    __typename
    primaryType
    types
    domain {
      ...DomainData
    }
    message
  }`,
  [DomainDataFragment],
);
export type OrderTypedData = FragmentOf<typeof OrderTypedDataFragment>;

export const OrderAdapterApprovalFragment = graphql(
  `fragment OrderAdapterApproval on OrderAdapterApproval {
    __typename
    bySignature {
      ...SwapTypedData
    }
  }`,
  [SwapTypedDataFragment],
);
export type OrderAdapterApproval = FragmentOf<
  typeof OrderAdapterApprovalFragment
>;

export const OrderPositionManagerApprovalFragment = graphql(
  `fragment OrderPositionManagerApproval on OrderPositionManagerApproval {
    __typename
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...SwapTypedData
    }
  }`,
  [TransactionRequestFragment, SwapTypedDataFragment],
);
export type OrderPositionManagerApproval = FragmentOf<
  typeof OrderPositionManagerApprovalFragment
>;

export const OrderSetCollateralApprovalFragment = graphql(
  `fragment OrderSetCollateralApproval on OrderSetCollateralApproval {
    __typename
    bySignature {
      ...SwapTypedData
    }
  }`,
  [SwapTypedDataFragment],
);
export type OrderSetCollateralApproval = FragmentOf<
  typeof OrderSetCollateralApprovalFragment
>;

export const OrderApprovalFragment = graphql(
  `fragment OrderApproval on OrderApproval {
    __typename
    ... on OrderAdapterApproval {
      ...OrderAdapterApproval
    }
    ... on OrderPositionManagerApproval {
      ...OrderPositionManagerApproval
    }
    ... on OrderSetCollateralApproval {
      ...OrderSetCollateralApproval
    }
  }`,
  [
    OrderAdapterApprovalFragment,
    OrderPositionManagerApprovalFragment,
    OrderSetCollateralApprovalFragment,
  ],
);
export type OrderApproval = FragmentOf<typeof OrderApprovalFragment>;

export const LeverageApprovalsRequiredFragment = graphql(
  `fragment LeverageApprovalsRequired on LeverageApprovalsRequired {
    __typename
    quote {
      ...OrderQuote
    }
    approvals {
      ...OrderApproval
    }
    maxSafeMultiplier
  }`,
  [OrderQuoteFragment, OrderApprovalFragment],
);
export type LeverageApprovalsRequired = FragmentOf<
  typeof LeverageApprovalsRequiredFragment
>;

export const LeverageQuoteResultFragment = graphql(
  `fragment LeverageQuoteResult on LeverageQuoteResult {
    __typename
    ... on LeverageApprovalsRequired {
      ...LeverageApprovalsRequired
    }
    ... on InsufficientLiquidityError {
      ...InsufficientLiquidityError
    }
  }`,
  [LeverageApprovalsRequiredFragment, InsufficientLiquidityErrorFragment],
);
export type LeverageQuoteResult = ExtendWithOpaqueType<
  FragmentOf<typeof LeverageQuoteResultFragment>
>;

export type OrderOperation =
  | SupplySwap
  | BorrowSwap
  | RepayWithSupply
  | WithdrawSwap
  | TokenSwap
  | Leverage;

export const OrderOperationFragment: FragmentDocumentFor<
  OrderOperation,
  'OrderOperation'
> = graphql(
  `fragment OrderOperation on OrderOperation {
    __typename
    ... on SupplySwap {
      ...SupplySwap
    }
    ... on BorrowSwap {
      ...BorrowSwap
    }
    ... on RepayWithSupply {
      ...RepayWithSupply
    }
    ... on WithdrawSwap {
      ...WithdrawSwap
    }
    ... on TokenSwap {
      ...TokenSwap
    }
    ... on Leverage {
      ...Leverage
    }
  }`,
  [
    SupplySwapFragment,
    BorrowSwapFragment,
    RepayWithSupplyFragment,
    WithdrawSwapFragment,
    TokenSwapFragment,
    LeverageFragment,
  ],
);

export const OrderOpenFragment = graphql(
  `fragment OrderOpen on OrderOpen {
    __typename
    orderId
    createdAt
    deadline
    explorerUrl
    operation {
      ...OrderOperation
    }
  }`,
  [OrderOperationFragment],
);
export type OrderOpen = FragmentOf<typeof OrderOpenFragment>;

export const OrderPendingSignatureFragment = graphql(
  `fragment OrderPendingSignature on OrderPendingSignature {
    __typename
    orderId
    createdAt
    deadline
    explorerUrl
    operation {
      ...OrderOperation
    }
  }`,
  [OrderOperationFragment],
);
export type OrderPendingSignature = FragmentOf<
  typeof OrderPendingSignatureFragment
>;

export const OrderFulfilledFragment = graphql(
  `fragment OrderFulfilled on OrderFulfilled {
    __typename
    orderId
    createdAt
    fulfilledAt
    txHash
    explorerUrl
    operation {
      ...OrderOperation
    }
  }`,
  [OrderOperationFragment],
);
export type OrderFulfilled = FragmentOf<typeof OrderFulfilledFragment>;

export const OrderCancelledFragment = graphql(
  `fragment OrderCancelled on OrderCancelled {
    __typename
    orderId
    createdAt
    cancelledAt
    explorerUrl
    operation {
      ...OrderOperation
    }
  }`,
  [OrderOperationFragment],
);
export type OrderCancelled = FragmentOf<typeof OrderCancelledFragment>;

export const OrderExpiredFragment = graphql(
  `fragment OrderExpired on OrderExpired {
    __typename
    orderId
    createdAt
    expiredAt
    explorerUrl
    operation {
      ...OrderOperation
    }
  }`,
  [OrderOperationFragment],
);
export type OrderExpired = FragmentOf<typeof OrderExpiredFragment>;

export const OrderStatusFragment = graphql(
  `fragment OrderStatus on OrderStatus {
    __typename
    ... on OrderOpen {
      ...OrderOpen
    }
    ... on OrderPendingSignature {
      ...OrderPendingSignature
    }
    ... on OrderCancelled {
      ...OrderCancelled
    }
    ... on OrderExpired {
      ...OrderExpired
    }
    ... on OrderFulfilled {
      ...OrderFulfilled
    }
  }`,
  [
    OrderOpenFragment,
    OrderPendingSignatureFragment,
    OrderCancelledFragment,
    OrderExpiredFragment,
    OrderFulfilledFragment,
  ],
);
export type OrderStatus = ExtendWithOpaqueType<
  FragmentOf<typeof OrderStatusFragment>
>;

export const PaginatedOrdersResultFragment = graphql(
  `fragment PaginatedOrdersResult on PaginatedOrdersResult {
    __typename
    items {
      ...OrderStatus
    }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [OrderStatusFragment, PaginatedResultInfoFragment],
);
export type PaginatedOrdersResult = FragmentOf<
  typeof PaginatedOrdersResultFragment
>;

export const OrderReceiptFragment = graphql(
  `fragment OrderReceipt on OrderReceipt {
    __typename
    orderId
  }`,
);
export type OrderReceipt = FragmentOf<typeof OrderReceiptFragment>;

export const OrderTransactionRequestFragment = graphql(
  `fragment OrderTransactionRequest on OrderTransactionRequest {
    __typename
    transaction {
      ...TransactionRequest
    }
    orderReceipt {
      ...OrderReceipt
    }
  }`,
  [TransactionRequestFragment, OrderReceiptFragment],
);
export type OrderTransactionRequest = FragmentOf<
  typeof OrderTransactionRequestFragment
>;

export const OrderExecutionPlanFragment = graphql(
  `fragment OrderExecutionPlan on OrderExecutionPlan {
    __typename
    ... on OrderTransactionRequest {
      ...OrderTransactionRequest
    }
    ... on OrderReceipt {
      ...OrderReceipt
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [
    OrderTransactionRequestFragment,
    OrderReceiptFragment,
    InsufficientBalanceErrorFragment,
  ],
);
export type OrderExecutionPlan = ExtendWithOpaqueType<
  FragmentOf<typeof OrderExecutionPlanFragment>
>;

export const PreparedOrderFragment = graphql(
  `fragment PreparedOrder on PreparedOrder {
    __typename
    newQuoteId
    data {
      ...OrderTypedData
    }
  }`,
  [OrderTypedDataFragment],
);
export type PreparedOrder = FragmentOf<typeof PreparedOrderFragment>;

export const PrepareOrderResultFragment = graphql(
  `fragment PrepareOrderResult on PrepareOrderResult {
    __typename
    ... on PreparedOrder {
      ...PreparedOrder
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [PreparedOrderFragment, InsufficientBalanceErrorFragment],
);
export type PrepareOrderResult = ExtendWithOpaqueType<
  FragmentOf<typeof PrepareOrderResultFragment>
>;

export const PrepareCancelOrderResultFragment = graphql(
  `fragment PrepareCancelOrderResult on PrepareCancelOrderResult {
    __typename
    data {
      ...OrderTypedData
    }
  }`,
  [OrderTypedDataFragment],
);
export type PrepareCancelOrderResult = FragmentOf<
  typeof PrepareCancelOrderResultFragment
>;

export const OrderCancelledResultFragment = graphql(
  `fragment OrderCancelledResult on OrderCancelledResult {
    __typename
    orderId
  }`,
);
export type OrderCancelledResult = FragmentOf<
  typeof OrderCancelledResultFragment
>;

export type CancelOrderExecutionPlan =
  | TransactionRequest
  | OrderCancelledResult;

export const CancelOrderExecutionPlanFragment: FragmentDocumentFor<
  CancelOrderExecutionPlan,
  'CancelOrderExecutionPlan'
> = graphql(
  `fragment CancelOrderExecutionPlan on CancelOrderExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on OrderCancelledResult {
      ...OrderCancelledResult
    }
  }`,
  [TransactionRequestFragment, OrderCancelledResultFragment],
);
