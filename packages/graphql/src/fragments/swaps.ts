import type { ExtendWithOpaqueType } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import { PermitTypedDataResponseFragment } from '../permits';
import {
  DomainDataFragment,
  type Erc20Amount,
  Erc20AmountFragment,
  type InsufficientBalanceError,
  InsufficientBalanceErrorFragment,
  type NativeAmount,
  NativeAmountFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  TokenAmountFragment,
} from './common';
import { ReserveInfoFragment } from './reserve';
import {
  type TransactionRequest,
  TransactionRequestFragment,
} from './transactions';

export const Erc20ApprovalFragment = graphql(
  `fragment Erc20Approval on Erc20Approval {
    __typename
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...PermitTypedDataResponse
    }
  }`,
  [TransactionRequestFragment, PermitTypedDataResponseFragment],
);
export type Erc20Approval = FragmentOf<typeof Erc20ApprovalFragment>;

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
    quoteId
    suggestedSlippage {
      ...PercentNumber
    }
    spotBuy {
      ...TokenAmount
    }
    spotSell {
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
      ...Erc20Approval
    }
    quote {
      ...SwapQuote
    }
  }`,
  [Erc20ApprovalFragment, SwapQuoteFragment, SwapTypedDataFragment],
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

export type TokenSwapQuoteResult = ExtendWithOpaqueType<
  SwapByIntent | SwapByIntentWithApprovalRequired | SwapByTransaction
>;

export const TokenSwapQuoteResultFragment: FragmentDocumentFor<
  TokenSwapQuoteResult,
  'TokenSwapQuoteResult'
> = graphql(
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
  }`,
  [
    SwapByIntentFragment,
    SwapByIntentWithApprovalRequiredFragment,
    SwapByTransactionFragment,
  ],
);

export const PrepareTokenSwapResultFragment = graphql(
  `fragment PrepareTokenSwapResult on PrepareTokenSwapResult {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [SwapByIntentFragment, InsufficientBalanceErrorFragment],
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

export type SwapExecutionPlan = ExtendWithOpaqueType<
  SwapTransactionRequest | SwapReceipt | InsufficientBalanceError
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

export type SupplySwapQuoteResult = PositionSwapByIntentApprovalsRequired;

export const SupplySwapQuoteResultFragment: FragmentDocumentFor<
  SupplySwapQuoteResult,
  'SupplySwapQuoteResult'
> = graphql(
  `fragment SupplySwapQuoteResult on SupplySwapQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type BorrowSwapQuoteResult = PositionSwapByIntentApprovalsRequired;

export const BorrowSwapQuoteResultFragment: FragmentDocumentFor<
  BorrowSwapQuoteResult,
  'BorrowSwapQuoteResult'
> = graphql(
  `fragment BorrowSwapQuoteResult on BorrowSwapQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type RepayWithSupplyQuoteResult = PositionSwapByIntentApprovalsRequired;

export const RepayWithSupplyQuoteResultFragment: FragmentDocumentFor<
  RepayWithSupplyQuoteResult,
  'RepayWithSupplyQuoteResult'
> = graphql(
  `fragment RepayWithSupplyQuoteResult on RepayWithSupplyQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type WithdrawSwapQuoteResult = PositionSwapByIntentApprovalsRequired;

export const WithdrawSwapQuoteResultFragment: FragmentDocumentFor<
  WithdrawSwapQuoteResult,
  'WithdrawSwapQuoteResult'
> = graphql(
  `fragment WithdrawSwapQuoteResult on WithdrawSwapQuoteResult {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      ...PositionSwapByIntentApprovalsRequired
    }
  }`,
  [PositionSwapByIntentApprovalsRequiredFragment],
);

export type PreparePositionSwapResult = ExtendWithOpaqueType<
  SwapByIntent | InsufficientBalanceError
>;

export const PreparePositionSwapResultFragment: FragmentDocumentFor<
  PreparePositionSwapResult,
  'PreparePositionSwapResult'
> = graphql(
  `fragment PreparePositionSwapResult on PreparePositionSwapResult {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [SwapByIntentFragment, InsufficientBalanceErrorFragment],
);
