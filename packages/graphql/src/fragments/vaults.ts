import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  ChainFragment,
  DecimalNumberFragment,
  Erc20TokenFragment,
  type InsufficientBalanceError,
  InsufficientBalanceErrorFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
} from './common';
import {
  type Erc20ApprovalRequired,
  Erc20ApprovalRequiredFragment,
  type TransactionRequest,
  TransactionRequestFragment,
} from './transactions';

export const BoostedRateFragment = graphql(
  `fragment BoostedRate on BoostedRate {
    __typename
    id
    name
    userCount
    apy {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type BoostedRate = FragmentOf<typeof BoostedRateFragment>;

export const StableVaultSummaryFragment = graphql(
  `fragment StableVaultSummary on StableVaultSummary {
    __typename
    shares
    userCount
    totalDeposits
  }`,
);
export type StableVaultSummary = FragmentOf<typeof StableVaultSummaryFragment>;

export const StableVaultRatesFragment = graphql(
  `fragment StableVaultRates on StableVaultRates {
    __typename
    baseRate {
      ...PercentNumber
    }
    name
    boostedRates {
      ...BoostedRate
    }
  }`,
  [PercentNumberFragment, BoostedRateFragment],
);
export type StableVaultRates = FragmentOf<typeof StableVaultRatesFragment>;

export const StableVaultFragment = graphql(
  `fragment StableVault on StableVault {
    __typename
    id
    name
    address
    admin
    chain {
      ...Chain
    }
    summary {
      ...StableVaultSummary
    }
    rates {
      ...StableVaultRates
    }
  }`,
  [ChainFragment, StableVaultSummaryFragment, StableVaultRatesFragment],
);
export type StableVault = FragmentOf<typeof StableVaultFragment>;

export const StableVaultUserPositionFragment = graphql(
  `fragment StableVaultUserPosition on StableVaultUserPosition {
    __typename
    vault {
      ...StableVault
    }
    user
    principal {
      ...DecimalNumber
    }
    interests {
      ...DecimalNumber
    }
    shares {
      ...DecimalNumber
    }
    totalBalance {
      ...DecimalNumber
    }
    apy {
      ...PercentNumber
    }
    boostedRateId
  }`,
  [StableVaultFragment, DecimalNumberFragment, PercentNumberFragment],
);
export type StableVaultUserPosition = FragmentOf<
  typeof StableVaultUserPositionFragment
>;

export const TokenMovementAllocateFragment = graphql(
  `fragment TokenMovementAllocate on TokenMovementAllocate {
    __typename
    token {
      ...Erc20Token
    }
    amount
  }`,
  [Erc20TokenFragment],
);
export type TokenMovementAllocate = FragmentOf<
  typeof TokenMovementAllocateFragment
>;

export const TokenMovementBridgeInFragment = graphql(
  `fragment TokenMovementBridgeIn on TokenMovementBridgeIn {
    __typename
    fromToken {
      ...Erc20Token
    }
    toToken {
      ...Erc20Token
    }
    amount
  }`,
  [Erc20TokenFragment],
);
export type TokenMovementBridgeIn = FragmentOf<
  typeof TokenMovementBridgeInFragment
>;

export const TokenMovementBridgeOutFragment = graphql(
  `fragment TokenMovementBridgeOut on TokenMovementBridgeOut {
    __typename
    fromToken {
      ...Erc20Token
    }
    toToken {
      ...Erc20Token
    }
    amount
  }`,
  [Erc20TokenFragment],
);
export type TokenMovementBridgeOut = FragmentOf<
  typeof TokenMovementBridgeOutFragment
>;

export const TokenMovementDeallocateFragment = graphql(
  `fragment TokenMovementDeallocate on TokenMovementDeallocate {
    __typename
    token {
      ...Erc20Token
    }
    amount
  }`,
  [Erc20TokenFragment],
);
export type TokenMovementDeallocate = FragmentOf<
  typeof TokenMovementDeallocateFragment
>;

export const TokenMovementRebalanceFragment = graphql(
  `fragment TokenMovementRebalance on TokenMovementRebalance {
    __typename
    token {
      ...Erc20Token
    }
    amount
  }`,
  [Erc20TokenFragment],
);
export type TokenMovementRebalance = FragmentOf<
  typeof TokenMovementRebalanceFragment
>;

export const TokenMovementSwapFragment = graphql(
  `fragment TokenMovementSwap on TokenMovementSwap {
    __typename
    fromToken {
      ...Erc20Token
    }
    fromAmount
    toToken {
      ...Erc20Token
    }
    toAmount
  }`,
  [Erc20TokenFragment],
);
export type TokenMovementSwap = FragmentOf<typeof TokenMovementSwapFragment>;

export type TokenMovement =
  | TokenMovementAllocate
  | TokenMovementBridgeIn
  | TokenMovementBridgeOut
  | TokenMovementDeallocate
  | TokenMovementRebalance
  | TokenMovementSwap;

export const TokenMovementFragment: FragmentDocumentFor<
  TokenMovement,
  'TokenMovement'
> = graphql(
  `fragment TokenMovement on TokenMovement {
    __typename
    ... on TokenMovementAllocate {
      ...TokenMovementAllocate
    }
    ... on TokenMovementBridgeIn {
      ...TokenMovementBridgeIn
    }
    ... on TokenMovementBridgeOut {
      ...TokenMovementBridgeOut
    }
    ... on TokenMovementDeallocate {
      ...TokenMovementDeallocate
    }
    ... on TokenMovementSwap {
      ...TokenMovementSwap
    }
    ... on TokenMovementRebalance {
      ...TokenMovementRebalance
    }
  }`,
  [
    TokenMovementAllocateFragment,
    TokenMovementBridgeInFragment,
    TokenMovementBridgeOutFragment,
    TokenMovementDeallocateFragment,
    TokenMovementSwapFragment,
    TokenMovementRebalanceFragment,
  ],
);

export const TokenMovementRecordFragment = graphql(
  `fragment TokenMovementRecord on TokenMovementRecord {
    __typename
    id
    type {
      ...TokenMovement
    }
    status
    timestamp
    txHash
  }`,
  [TokenMovementFragment],
);
export type TokenMovementRecord = FragmentOf<
  typeof TokenMovementRecordFragment
>;

export const PaginatedStableVaultMovementsResultFragment = graphql(
  `fragment PaginatedStableVaultMovementsResult on PaginatedStableVaultMovementsResult {
    __typename
    items {
      ...TokenMovementRecord
    }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [TokenMovementRecordFragment, PaginatedResultInfoFragment],
);
export type PaginatedStableVaultMovementsResult = FragmentOf<
  typeof PaginatedStableVaultMovementsResultFragment
>;

export const PaginatedStableVaultRateUsersResultFragment = graphql(
  `fragment PaginatedStableVaultRateUsersResult on PaginatedStableVaultRateUsersResult {
    __typename
    items
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [PaginatedResultInfoFragment],
);
export type PaginatedStableVaultRateUsersResult = FragmentOf<
  typeof PaginatedStableVaultRateUsersResultFragment
>;

export const StableVaultWithdrawClaimFragment = graphql(
  `fragment StableVaultWithdrawClaim on StableVaultWithdrawClaim {
    __typename
    claimId
    transaction {
      ...TransactionRequest
    }
    executableAfter
  }`,
  [TransactionRequestFragment],
);
export type StableVaultWithdrawClaim = FragmentOf<
  typeof StableVaultWithdrawClaimFragment
>;

export const StableVaultPendingAvailabilityFragment = graphql(
  `fragment StableVaultPendingAvailability on StableVaultPendingAvailability {
    __typename
    executableAfter
  }`,
);
export type StableVaultPendingAvailability = FragmentOf<
  typeof StableVaultPendingAvailabilityFragment
>;

export type StableVaultDepositExecutionPlan =
  | TransactionRequest
  | Erc20ApprovalRequired
  | InsufficientBalanceError;

export const StableVaultDepositExecutionPlanFragment: FragmentDocumentFor<
  StableVaultDepositExecutionPlan,
  'StableVaultDepositExecutionPlan'
> = graphql(
  `fragment StableVaultDepositExecutionPlan on StableVaultDepositExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on Erc20ApprovalRequired {
      ...Erc20ApprovalRequired
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }`,
  [
    TransactionRequestFragment,
    Erc20ApprovalRequiredFragment,
    InsufficientBalanceErrorFragment,
  ],
);

export type StableVaultWithdrawExecutionPlan =
  | TransactionRequest
  | StableVaultWithdrawClaim;

export const StableVaultWithdrawExecutionPlanFragment: FragmentDocumentFor<
  StableVaultWithdrawExecutionPlan,
  'StableVaultWithdrawExecutionPlan'
> = graphql(
  `fragment StableVaultWithdrawExecutionPlan on StableVaultWithdrawExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on StableVaultWithdrawClaim {
      ...StableVaultWithdrawClaim
    }
  }`,
  [TransactionRequestFragment, StableVaultWithdrawClaimFragment],
);

export type StableVaultWithdrawRedeemExecutionPlan =
  | TransactionRequest
  | StableVaultPendingAvailability;

export const StableVaultWithdrawRedeemExecutionPlanFragment: FragmentDocumentFor<
  StableVaultWithdrawRedeemExecutionPlan,
  'StableVaultWithdrawRedeemExecutionPlan'
> = graphql(
  `fragment StableVaultWithdrawRedeemExecutionPlan on StableVaultWithdrawRedeemExecutionPlan {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on StableVaultPendingAvailability {
      ...StableVaultPendingAvailability
    }
  }`,
  [TransactionRequestFragment, StableVaultPendingAvailabilityFragment],
);
