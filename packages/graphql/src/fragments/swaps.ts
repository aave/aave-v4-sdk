import type { ExtendWithOpaqueType } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  DomainDataFragment,
  type Erc20Amount,
  Erc20AmountFragment,
  type NativeAmount,
  NativeAmountFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  TokenAmountFragment,
} from './common';
import { ReserveInfoFragment } from './reserve';
import {
  type InsufficientBalanceError,
  InsufficientBalanceErrorFragment,
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
  }`,
  [TokenAmountFragment],
);
export type SwapQuoteCosts = FragmentOf<typeof SwapQuoteCostsFragment>;

export const SwapQuoteFragment = graphql(
  `fragment SwapQuote on SwapQuote {
    __typename
    quoteId
    suggestedSlippage {
      ...PercentNumber
    }
    desiredSell {
      ...TokenAmount
    }
    desiredBuy {
      ...TokenAmount
    }
    costs {
      ...SwapQuoteCosts
    }
    minimumReceived {
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

export const SwapByIntentFragment = graphql(
  `fragment SwapByIntent on SwapByIntent {
    __typename
    quote {
      ...SwapQuote
    }
    data {
      ...SwapTypedData
    }
  }`,
  [SwapQuoteFragment, SwapTypedDataFragment],
);
export type SwapByIntent = FragmentOf<typeof SwapByIntentFragment>;

export const SwapByIntentWithApprovalRequiredFragment = graphql(
  `fragment SwapByIntentWithApprovalRequired on SwapByIntentWithApprovalRequired {
    __typename
    approval {
      ...TransactionRequest
    }
    quote {
      ...SwapQuote
    }
    data {
      ...SwapTypedData
    }
  }`,
  [TransactionRequestFragment, SwapQuoteFragment, SwapTypedDataFragment],
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
    explorerLink
    createdAt
  }`,
);
export type SwapReceipt = FragmentOf<typeof SwapReceiptFragment>;

export const PrepareTokenSwapResultFragment = graphql(
  `fragment PrepareTokenSwapResult on PrepareTokenSwapResult {
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
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [
    SwapByIntentFragment,
    SwapByIntentWithApprovalRequiredFragment,
    SwapByTransactionFragment,
    InsufficientBalanceErrorFragment,
  ],
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

export const SwapApprovalRequiredFragment = graphql(
  `fragment SwapApprovalRequired on SwapApprovalRequired {
    __typename
    approval {
      ...TransactionRequest
    }
    originalTransaction {
      ...SwapTransactionRequest
    }
  }`,
  [TransactionRequestFragment, SwapTransactionRequestFragment],
);
export type SwapApprovalRequired = FragmentOf<
  typeof SwapApprovalRequiredFragment
>;

export type SwapExecutionPlan = ExtendWithOpaqueType<
  | SwapTransactionRequest
  | SwapApprovalRequired
  | InsufficientBalanceError
  | SwapReceipt
>;

export const SwapExecutionPlanFragment: FragmentDocumentFor<
  SwapExecutionPlan,
  'SwapExecutionPlan'
> = graphql(
  `fragment SwapExecutionPlan on SwapExecutionPlan {
    __typename
    ... on SwapTransactionRequest {
      ...SwapTransactionRequest
    }
    ... on SwapApprovalRequired {
      ...SwapApprovalRequired
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
    ... on SwapReceipt {
      ...SwapReceipt
    }
  }`,
  [
    SwapTransactionRequestFragment,
    SwapApprovalRequiredFragment,
    InsufficientBalanceErrorFragment,
    SwapReceiptFragment,
  ],
);

export const SwapCancelledFragment = graphql(
  `fragment SwapCancelled on SwapCancelled {
    __typename
    createdAt
    cancelledAt
    explorerLink
  }`,
);
export type SwapCancelled = FragmentOf<typeof SwapCancelledFragment>;

export const SwapExpiredFragment = graphql(
  `fragment SwapExpired on SwapExpired {
    __typename
    createdAt
    expiredAt
    explorerLink
  }`,
);
export type SwapExpired = FragmentOf<typeof SwapExpiredFragment>;

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

export type SwapAmount = PositionAmount | NativeAmount | Erc20Amount;

export const SwapAmountFragment: FragmentDocumentFor<SwapAmount, 'SwapAmount'> =
  graphql(
    `fragment SwapAmount on SwapAmount {
    __typename
    ... on PositionAmount {
      ...PositionAmount
    }
    ... on NativeAmount {
      ...NativeAmount
    }
    ... on Erc20Amount {
      ...Erc20Amount
    }
  }`,
    [PositionAmountFragment, NativeAmountFragment, Erc20AmountFragment],
  );

export const SwapOpenFragment = graphql(
  `fragment SwapOpen on SwapOpen {
    __typename
    swapId
    createdAt
    deadline
    explorerLink
    desiredSell {
      ...SwapAmount
    }
    desiredBuy {
      ...SwapAmount
    }
  }`,
  [SwapAmountFragment],
);
export type SwapOpen = FragmentOf<typeof SwapOpenFragment>;

export const SwapPendingSignatureFragment = graphql(
  `fragment SwapPendingSignature on SwapPendingSignature {
    __typename
    createdAt
    deadline
    explorerLink
  }`,
);
export type SwapPendingSignature = FragmentOf<
  typeof SwapPendingSignatureFragment
>;

export const SwapFulfilledFragment = graphql(
  `fragment SwapFulfilled on SwapFulfilled {
    __typename
    txHash
    desiredSell {
      ...SwapAmount
    }
    desiredBuy {
      ...SwapAmount
    }
    sold {
      ...SwapAmount
    }
    bought {
      ...SwapAmount
    }
    createdAt
    fulfilledAt
    explorerLink
    refundTxHash
  }`,
  [SwapAmountFragment],
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
  FragmentOf<typeof SwapStatusFragment>,
  {
    createdAt: Date;
    explorerLink: string;
  }
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

export type CancelSwapExecutionPlan = TransactionRequest | SwapCancelled;

export const CancelSwapExecutionPlanFragment: FragmentDocumentFor<
  CancelSwapExecutionPlan,
  'CancelSwapExecutionPlan'
> = graphql(
  `fragment CancelSwapExecutionPlan on CancelSwapExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on SwapCancelled {
      ...SwapCancelled
    }
  }`,
  [TransactionRequestFragment, SwapCancelledFragment],
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
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...SwapTypedData
    }
  }`,
  [TransactionRequestFragment, SwapTypedDataFragment],
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

export type PrepareSupplySwapResult = PositionSwapByIntentApprovalsRequired;

export const PrepareSupplySwapResultFragment: FragmentDocumentFor<
  PrepareSupplySwapResult,
  'PrepareSupplySwapResult'
> = graphql(
  `fragment PrepareSupplySwapResult on PrepareSupplySwapResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type PrepareBorrowSwapResult = PositionSwapByIntentApprovalsRequired;

export const PrepareBorrowSwapResultFragment: FragmentDocumentFor<
  PrepareBorrowSwapResult,
  'PrepareBorrowSwapResult'
> = graphql(
  `fragment PrepareBorrowSwapResult on PrepareBorrowSwapResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type PrepareRepayWithSupplyResult =
  PositionSwapByIntentApprovalsRequired;

export const PrepareRepayWithSupplyResultFragment: FragmentDocumentFor<
  PrepareRepayWithSupplyResult,
  'PrepareRepayWithSupplyResult'
> = graphql(
  `fragment PrepareRepayWithSupplyResult on PrepareRepayWithSupplyResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type PrepareWithdrawSwapResult = PositionSwapByIntentApprovalsRequired;

export const PrepareWithdrawSwapResultFragment: FragmentDocumentFor<
  PrepareWithdrawSwapResult,
  'PrepareWithdrawSwapResult'
> = graphql(
  `fragment PrepareWithdrawSwapResult on PrepareWithdrawSwapResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type PreparePositionSwapResult = ExtendWithOpaqueType<SwapByIntent>;

export const PreparePositionSwapResultFragment: FragmentDocumentFor<
  PreparePositionSwapResult,
  'PreparePositionSwapResult'
> = graphql(
  `fragment PreparePositionSwapResult on PreparePositionSwapResult {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
  }`,
  [SwapByIntentFragment],
);
