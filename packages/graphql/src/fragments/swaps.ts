import type { ExtendWithOpaqueType } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  DomainDataFragment,
  Erc20AmountFragment,
  InsufficientBalanceErrorFragment,
  InsufficientLiquidityErrorFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  TokenAmountFragment,
} from './common';
import { ReserveInfoFragment } from './reserve';
import {
  Erc20ApprovalFragment,
  type TransactionRequest,
  TransactionRequestFragment,
} from './transactions';

export const SwapQuoteCostsFragment = graphql(
  `fragment SwapQuoteCosts on SwapQuoteCosts {
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
export type SwapQuoteCosts = FragmentOf<typeof SwapQuoteCostsFragment>;

export const SwapQuoteFragment = graphql(
  `fragment SwapQuote on SwapQuote {
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
      ...SwapQuoteCosts
    }
    finalBuy {
      ...TokenAmount
    }
    finalSell {
      ...TokenAmount
    }
  }`,
  [PercentNumberFragment, TokenAmountFragment, SwapQuoteCostsFragment],
);
export type SwapQuote = FragmentOf<typeof SwapQuoteFragment>;

export const SwapTypedDataFragment = graphql(
  `fragment SwapTypedData on SwapTypedData {
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
export type SwapTypedData = FragmentOf<typeof SwapTypedDataFragment>;

export const PrepareSwapOrderFragment = graphql(
  `fragment PrepareSwapOrder on PrepareSwapOrder {
    __typename
    newQuoteId
    data {
      ...SwapTypedData
    }
  }`,
  [SwapTypedDataFragment],
);
export type PrepareSwapOrder = FragmentOf<typeof PrepareSwapOrderFragment>;

export const SwapByIntentFragment = graphql(
  `fragment SwapByIntent on SwapByIntent {
    __typename
    quote {
      ...SwapQuote
    }
  
  }`,
  [SwapQuoteFragment],
);
export type SwapByIntent = FragmentOf<typeof SwapByIntentFragment>;

export const SwapByIntentWithApprovalRequiredFragment = graphql(
  `fragment SwapByIntentWithApprovalRequired on SwapByIntentWithApprovalRequired {
    __typename
    approvals {
      ...Erc20Approval
    }
    quote {
      ...SwapQuote
    }
  }`,
  [Erc20ApprovalFragment, SwapQuoteFragment],
);
export type SwapByIntentWithApprovalRequired = FragmentOf<
  typeof SwapByIntentWithApprovalRequiredFragment
>;

export const SwapByTransactionFragment = graphql(
  `fragment SwapByTransaction on SwapByTransaction {
    __typename
    quote {
      ...SwapQuote
    }
  }`,
  [SwapQuoteFragment],
);
export type SwapByTransaction = FragmentOf<typeof SwapByTransactionFragment>;

export const SwapReceiptFragment = graphql(
  `fragment SwapReceipt on SwapReceipt {
    __typename
    id
    createdAt
  }`,
);
export type SwapReceipt = FragmentOf<typeof SwapReceiptFragment>;

export const TokenSwapQuoteResultFragment = graphql(
  `fragment TokenSwapQuoteResult on TokenSwapQuoteResult {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
    ... on SwapByIntentWithApprovalRequired {
      ...SwapByIntentWithApprovalRequired
    }
    ... on SwapByTransaction {
      ...SwapByTransaction
    }
    ... on InsufficientLiquidityError {
      ...InsufficientLiquidityError
    }
  }`,
  [
    SwapByIntentFragment,
    SwapByIntentWithApprovalRequiredFragment,
    SwapByTransactionFragment,
    InsufficientLiquidityErrorFragment,
  ],
);
export type TokenSwapQuoteResult = ExtendWithOpaqueType<
  FragmentOf<typeof TokenSwapQuoteResultFragment>
>;

export const PrepareTokenSwapResultFragment = graphql(
  `fragment PrepareTokenSwapResult on PrepareTokenSwapResult {
    __typename
    ... on PrepareSwapOrder {
      ...PrepareSwapOrder
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [PrepareSwapOrderFragment, InsufficientBalanceErrorFragment],
);
export type PrepareTokenSwapResult = ExtendWithOpaqueType<
  FragmentOf<typeof PrepareTokenSwapResultFragment>
>;

export const SwapTransactionRequestFragment = graphql(
  `fragment SwapTransactionRequest on SwapTransactionRequest {
    __typename
    transaction {
      ...TransactionRequest
    }
    orderReceipt {
      ...SwapReceipt
    }
  }`,
  [TransactionRequestFragment, SwapReceiptFragment],
);
export type SwapTransactionRequest = FragmentOf<
  typeof SwapTransactionRequestFragment
>;

export const SwapExecutionPlanFragment = graphql(
  `fragment SwapExecutionPlan on SwapExecutionPlan {
    __typename
    ... on SwapTransactionRequest {
      ...SwapTransactionRequest
    }
    ... on SwapReceipt {
      ...SwapReceipt
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [
    SwapTransactionRequestFragment,
    SwapReceiptFragment,
    InsufficientBalanceErrorFragment,
  ],
);

export type SwapExecutionPlan = ExtendWithOpaqueType<
  FragmentOf<typeof SwapExecutionPlanFragment>
>;

export const PositionAmountFragment = graphql(
  `fragment PositionAmount on PositionAmount {
    __typename
    reserve {
      ...ReserveInfo
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [ReserveInfoFragment, Erc20AmountFragment],
);
export type PositionAmount = FragmentOf<typeof PositionAmountFragment>;

export const SupplySwapFragment = graphql(
  `fragment SupplySwap on SupplySwap {
    __typename
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    kind
    orderClass
  }`,
  [PositionAmountFragment],
);
export type SupplySwap = FragmentOf<typeof SupplySwapFragment>;

export const BorrowSwapFragment = graphql(
  `fragment BorrowSwap on BorrowSwap {
    __typename
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    kind
    orderClass
  }`,
  [PositionAmountFragment],
);
export type BorrowSwap = FragmentOf<typeof BorrowSwapFragment>;

export const RepayWithSupplyFragment = graphql(
  `fragment RepayWithSupply on RepayWithSupply {
    __typename
    repay {
      ...PositionAmount
    }
    supply {
      ...PositionAmount
    }
    kind
    orderClass
  }`,
  [PositionAmountFragment],
);
export type RepayWithSupply = FragmentOf<typeof RepayWithSupplyFragment>;

export const WithdrawSwapFragment = graphql(
  `fragment WithdrawSwap on WithdrawSwap {
    __typename
    withdraw {
      ...PositionAmount
    }
    buy {
      ...TokenAmount
    }
    kind
    orderClass
  }`,
  [PositionAmountFragment, TokenAmountFragment],
);
export type WithdrawSwap = FragmentOf<typeof WithdrawSwapFragment>;

export const TokenSwapFragment = graphql(
  `fragment TokenSwap on TokenSwap {
    __typename
    sell {
      ...TokenAmount
    }
    buy {
      ...TokenAmount
    }
    kind
    orderClass
  }`,
  [TokenAmountFragment],
);
export type TokenSwap = FragmentOf<typeof TokenSwapFragment>;

export type SwapOperation =
  | SupplySwap
  | BorrowSwap
  | RepayWithSupply
  | WithdrawSwap
  | TokenSwap;

export const SwapOperationFragment: FragmentDocumentFor<
  SwapOperation,
  'SwapOperation'
> = graphql(
  `fragment SwapOperation on SwapOperation {
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
  }`,
  [
    SupplySwapFragment,
    BorrowSwapFragment,
    RepayWithSupplyFragment,
    WithdrawSwapFragment,
    TokenSwapFragment,
  ],
);

export const SwapCancelledFragment = graphql(
  `fragment SwapCancelled on SwapCancelled {
    __typename
    swapId
    createdAt
    cancelledAt
    explorerUrl
    operation {
      ...SwapOperation
    }
  }`,
  [SwapOperationFragment],
);
export type SwapCancelled = FragmentOf<typeof SwapCancelledFragment>;

export const SwapExpiredFragment = graphql(
  `fragment SwapExpired on SwapExpired {
    __typename
    swapId
    createdAt
    expiredAt
    explorerUrl
    operation {
      ...SwapOperation
    }
  }`,
  [SwapOperationFragment],
);
export type SwapExpired = FragmentOf<typeof SwapExpiredFragment>;

export const SwapOpenFragment = graphql(
  `fragment SwapOpen on SwapOpen {
    __typename
    swapId
    createdAt
    deadline
    explorerUrl
    operation {
      ...SwapOperation
    }
  }`,
  [SwapOperationFragment],
);
export type SwapOpen = FragmentOf<typeof SwapOpenFragment>;

export const SwapPendingSignatureFragment = graphql(
  `fragment SwapPendingSignature on SwapPendingSignature {
    __typename
    swapId
    createdAt
    deadline
    explorerUrl
    operation {
      ...SwapOperation
    }
  }`,
  [SwapOperationFragment],
);
export type SwapPendingSignature = FragmentOf<
  typeof SwapPendingSignatureFragment
>;

export const SwapFulfilledFragment = graphql(
  `fragment SwapFulfilled on SwapFulfilled {
    __typename
    swapId
    txHash
    createdAt
    fulfilledAt
    explorerUrl
    refundTxHash
    operation {
      ...SwapOperation
    }
  }`,
  [SwapOperationFragment],
);
export type SwapFulfilled = FragmentOf<typeof SwapFulfilledFragment>;

export const SwapStatusFragment = graphql(
  `fragment SwapStatus on SwapStatus {
    __typename
    ... on SwapOpen {
      ...SwapOpen
    }
    ... on SwapPendingSignature {
      ...SwapPendingSignature
    }
    ... on SwapCancelled {
      ...SwapCancelled
    }
    ... on SwapExpired {
      ...SwapExpired
    }
    ... on SwapFulfilled {
      ...SwapFulfilled
    }
  }`,
  [
    SwapOpenFragment,
    SwapPendingSignatureFragment,
    SwapCancelledFragment,
    SwapExpiredFragment,
    SwapFulfilledFragment,
  ],
);

export type SwapStatus = ExtendWithOpaqueType<
  FragmentOf<typeof SwapStatusFragment>
>;

export const PrepareSwapCancelResultFragment = graphql(
  `fragment PrepareSwapCancelResult on PrepareSwapCancelResult {
    __typename
    data {
      ...SwapTypedData
    }
  }`,
  [SwapTypedDataFragment],
);
export type PrepareSwapCancelResult = FragmentOf<
  typeof PrepareSwapCancelResultFragment
>;

export const SwapCancelledResultFragment = graphql(
  `fragment SwapCancelledResult on SwapCancelledResult {
    __typename
    swapId
    createdAt
    cancelledAt
    explorerUrl
  }`,
);
export type SwapCancelledResult = FragmentOf<
  typeof SwapCancelledResultFragment
>;

export type CancelSwapExecutionPlan = TransactionRequest | SwapCancelledResult;

export const CancelSwapExecutionPlanFragment: FragmentDocumentFor<
  CancelSwapExecutionPlan,
  'CancelSwapExecutionPlan'
> = graphql(
  `fragment CancelSwapExecutionPlan on CancelSwapExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on SwapCancelledResult {
      ...SwapCancelledResult
    }
  }`,
  [TransactionRequestFragment, SwapCancelledResultFragment],
);

export const PaginatedUserSwapsResultFragment = graphql(
  `fragment PaginatedUserSwapsResult on PaginatedUserSwapsResult {
    __typename
    items {
      ...SwapStatus
    }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [SwapStatusFragment, PaginatedResultInfoFragment],
);
export type PaginatedUserSwapsResult = FragmentOf<
  typeof PaginatedUserSwapsResultFragment
>;

export const PositionSwapAdapterContractApprovalFragment = graphql(
  `fragment PositionSwapAdapterContractApproval on PositionSwapAdapterContractApproval {
    __typename
    bySignature {
      ...SwapTypedData
    }
  }`,
  [SwapTypedDataFragment],
);
export type PositionSwapAdapterContractApproval = FragmentOf<
  typeof PositionSwapAdapterContractApprovalFragment
>;

export const PositionSwapPositionManagerApprovalFragment = graphql(
  `fragment PositionSwapPositionManagerApproval on PositionSwapPositionManagerApproval {
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
export type PositionSwapPositionManagerApproval = FragmentOf<
  typeof PositionSwapPositionManagerApprovalFragment
>;

export const PositionSwapApprovalFragment = graphql(
  `fragment PositionSwapApproval on PositionSwapApproval {
    __typename
    ... on PositionSwapAdapterContractApproval {
      ...PositionSwapAdapterContractApproval
    }
    ... on PositionSwapPositionManagerApproval {
      ...PositionSwapPositionManagerApproval
    }
  }`,
  [
    PositionSwapAdapterContractApprovalFragment,
    PositionSwapPositionManagerApprovalFragment,
  ],
);
export type PositionSwapApproval = FragmentOf<
  typeof PositionSwapApprovalFragment
>;

export const PositionSwapByIntentApprovalsRequiredFragment = graphql(
  `fragment PositionSwapByIntentApprovalsRequired on PositionSwapByIntentApprovalsRequired {
    __typename
    quote {
      ...SwapQuote
    }
    approvals {
      ...PositionSwapApproval
    }
  }`,
  [SwapQuoteFragment, PositionSwapApprovalFragment],
);
export type PositionSwapByIntentApprovalsRequired = FragmentOf<
  typeof PositionSwapByIntentApprovalsRequiredFragment
>;

export const SupplySwapQuoteResultFragment = graphql(
  `fragment SupplySwapQuoteResult on SupplySwapQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
    ... on InsufficientLiquidityError {
      ...InsufficientLiquidityError
    }
  }`,
  [
    PositionSwapByIntentApprovalsRequiredFragment,
    InsufficientLiquidityErrorFragment,
  ],
);
export type SupplySwapQuoteResult = ExtendWithOpaqueType<
  FragmentOf<typeof SupplySwapQuoteResultFragment>
>;

export const BorrowSwapQuoteResultFragment = graphql(
  `fragment BorrowSwapQuoteResult on BorrowSwapQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
    ... on InsufficientLiquidityError {
      ...InsufficientLiquidityError
    }
  }`,
  [
    PositionSwapByIntentApprovalsRequiredFragment,
    InsufficientLiquidityErrorFragment,
  ],
);
export type BorrowSwapQuoteResult = ExtendWithOpaqueType<
  FragmentOf<typeof BorrowSwapQuoteResultFragment>
>;

export const RepayWithSupplyQuoteResultFragment = graphql(
  `fragment RepayWithSupplyQuoteResult on RepayWithSupplyQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
    ... on InsufficientLiquidityError {
      ...InsufficientLiquidityError
    }
  }`,
  [
    PositionSwapByIntentApprovalsRequiredFragment,
    InsufficientLiquidityErrorFragment,
  ],
);
export type RepayWithSupplyQuoteResult = ExtendWithOpaqueType<
  FragmentOf<typeof RepayWithSupplyQuoteResultFragment>
>;

export const WithdrawSwapQuoteResultFragment = graphql(
  `fragment WithdrawSwapQuoteResult on WithdrawSwapQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
    ... on InsufficientLiquidityError {
      ...InsufficientLiquidityError
    }
  }`,
  [
    PositionSwapByIntentApprovalsRequiredFragment,
    InsufficientLiquidityErrorFragment,
  ],
);
export type WithdrawSwapQuoteResult = ExtendWithOpaqueType<
  FragmentOf<typeof WithdrawSwapQuoteResultFragment>
>;

export const PreparePositionSwapResultFragment = graphql(
  `fragment PreparePositionSwapResult on PreparePositionSwapResult {
    __typename
    ... on PrepareSwapOrder {
      ...PrepareSwapOrder
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [PrepareSwapOrderFragment, InsufficientBalanceErrorFragment],
);
export type PreparePositionSwapResult = ExtendWithOpaqueType<
  FragmentOf<typeof PreparePositionSwapResultFragment>
>;
