import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import { DomainDataFragment, TypeFieldFragment } from '../permits';
import {
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  TokenAmountFragment,
} from './common';
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

export const SwapByIntentTypeDefinitionFragment = graphql(
  `fragment SwapByIntentTypeDefinition on SwapByIntentTypeDefinition {
    EIP712Domain {
      ...TypeField
    }
    Order {
      ...TypeField
    }
  }`,
  [TypeFieldFragment],
);
export type SwapByIntentTypeDefinition = FragmentOf<
  typeof SwapByIntentTypeDefinitionFragment
>;

export const SwapByIntentTypedDataFragment = graphql(
  `fragment SwapByIntentTypedData on SwapByIntentTypedData {
    __typename
    types {
      ...SwapByIntentTypeDefinition
    }
    primaryType
    domain {
      ...DomainData
    }
    message
  }`,
  [SwapByIntentTypeDefinitionFragment, DomainDataFragment],
);
export type SwapByIntentTypedData = FragmentOf<
  typeof SwapByIntentTypedDataFragment
>;

export const SwapByIntentFragment = graphql(
  `fragment SwapByIntent on SwapByIntent {
    __typename
    quote {
      ...SwapQuote
    }
    data {
      ...SwapByIntentTypedData
    }
  }`,
  [SwapQuoteFragment, SwapByIntentTypedDataFragment],
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
      ...SwapByIntentTypedData
    }
  }`,
  [
    TransactionRequestFragment,
    SwapQuoteFragment,
    SwapByIntentTypedDataFragment,
  ],
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

export type PrepareSwapResult =
  | SwapByIntent
  | SwapByIntentWithApprovalRequired
  | SwapByTransaction
  | InsufficientBalanceError;

export const PrepareSwapResultFragment: FragmentDocumentFor<
  PrepareSwapResult,
  'PrepareSwapResult'
> = graphql(
  `fragment PrepareSwapResult on PrepareSwapResult {
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

export type SwapExecutionPlan =
  | SwapTransactionRequest
  | SwapApprovalRequired
  | InsufficientBalanceError
  | SwapReceipt;

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

export const SwapOpenFragment = graphql(
  `fragment SwapOpen on SwapOpen {
    __typename
    swapId
    createdAt
    deadline
    explorerLink
    desiredSell {
      ...TokenAmount
    }
    desiredBuy {
      ...TokenAmount
    }
  }`,
  [TokenAmountFragment],
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
      ...TokenAmount
    }
    desiredBuy {
      ...TokenAmount
    }
    sold {
      ...TokenAmount
    }
    bought {
      ...TokenAmount
    }
    createdAt
    fulfilledAt
    explorerLink
    refundTxHash
  }`,
  [TokenAmountFragment],
);
export type SwapFulfilled = FragmentOf<typeof SwapFulfilledFragment>;

export type SwapStatus =
  | SwapOpen
  | SwapPendingSignature
  | SwapCancelled
  | SwapExpired
  | SwapFulfilled;

export const SwapStatusFragment: FragmentDocumentFor<SwapStatus, 'SwapStatus'> =
  graphql(
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

export const CancelSwapTypeDefinitionFragment = graphql(
  `fragment CancelSwapTypeDefinition on CancelSwapTypeDefinition {
    OrderCancellations {
      ...TypeField
    }
    EIP712Domain {
      ...TypeField
    }
  }`,
  [TypeFieldFragment],
);
export type CancelSwapTypeDefinition = FragmentOf<
  typeof CancelSwapTypeDefinitionFragment
>;

export const CancelSwapTypedDataFragment = graphql(
  `fragment CancelSwapTypedData on CancelSwapTypedData {
    types {
      ...CancelSwapTypeDefinition
    }
    primaryType
    domain {
      ...DomainData
    }
    message
  }`,
  [CancelSwapTypeDefinitionFragment, DomainDataFragment],
);
export type CancelSwapTypedData = FragmentOf<
  typeof CancelSwapTypedDataFragment
>;

export const PrepareSwapCancelResultFragment = graphql(
  `fragment PrepareSwapCancelResult on PrepareSwapCancelResult {
    __typename
    data {
      ...CancelSwapTypedData
    }
  }`,
  [CancelSwapTypedDataFragment],
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

export const SwapTypedDataFragment = graphql(
  `fragment TypedData on TypedData {
    __typename
    types
    primaryType
    domain {
      ...DomainData
    }
    message
  }`,
  [DomainDataFragment],
);
export type SwapTypedData = FragmentOf<typeof SwapTypedDataFragment>;

export const PositionSwapAdapterContractApprovalFragment = graphql(
  `fragment PositionSwapAdapterContractApproval on PositionSwapAdapterContractApproval {
    __typename
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...TypedData
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
      ...TypedData
    }
  }`,
  [TransactionRequestFragment, SwapTypedDataFragment],
);
export type PositionSwapPositionManagerApproval = FragmentOf<
  typeof PositionSwapPositionManagerApprovalFragment
>;

export type PositionSwapApproval =
  | PositionSwapAdapterContractApproval
  | PositionSwapPositionManagerApproval;

export const PositionSwapApprovalFragment: FragmentDocumentFor<
  PositionSwapApproval,
  'PositionSwapApproval'
> = graphql(
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

export type PreparePositionSwapResult = SwapByIntent;

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
