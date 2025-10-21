import type {
  DateTime,
  EvmAddress,
  ID,
  TxHash,
  UserPositionId,
} from '@aave/types-next';
import type { FragmentOf } from 'gql.tada';
import {
  type Chain,
  ChainFragment,
  type Erc20Amount,
  Erc20AmountFragment,
  type Erc20ApprovalRequired,
  Erc20ApprovalRequiredFragment,
  ExecutionPlanFragment,
  type FiatAmountValueVariation,
  FiatAmountValueVariationFragment,
  type HealthFactorResult,
  HealthFactorResultFragment,
  type InsufficientBalanceError,
  InsufficientBalanceErrorFragment,
  PaginatedResultInfoFragment,
  type PercentNumberVariation,
  PercentNumberVariationFragment,
  type ReserveInfo,
  ReserveInfoFragment,
  type Spoke,
  SpokeFragment,
  type TokenAmount,
  TokenAmountFragment,
  type TransactionRequest,
  TransactionRequestFragment,
} from './fragments';
import { type FragmentDocumentFor, graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const BorrowQuery = graphql(
  `query Borrow($request: BorrowRequest!) {
    value: borrow(request: $request) {
      ...ExecutionPlan
    }
  }`,
  [ExecutionPlanFragment],
);
export type BorrowRequest = RequestOf<typeof BorrowQuery>;

/**
 * @internal
 */
export const SupplyQuery = graphql(
  `query Supply($request: SupplyRequest!) {
    value: supply(request: $request) {
      ...ExecutionPlan
    }
  }`,
  [ExecutionPlanFragment],
);
export type SupplyRequest = RequestOf<typeof SupplyQuery>;

/**
 * @internal
 */
export const RepayQuery = graphql(
  `query Repay($request: RepayRequest!) {
    value: repay(request: $request) {
      ...ExecutionPlan
    }
  }`,
  [ExecutionPlanFragment],
);
export type RepayRequest = RequestOf<typeof RepayQuery>;

/**
 * @internal
 */
export const WithdrawQuery = graphql(
  `query Withdraw($request: WithdrawRequest!) {
    value: withdraw(request: $request) {
      ...ExecutionPlan
    }
  }`,
  [ExecutionPlanFragment],
);
export type WithdrawRequest = RequestOf<typeof WithdrawQuery>;

export type LiquidatePositionExecutionPlan =
  | TransactionRequest
  | Erc20ApprovalRequired
  | InsufficientBalanceError;

export const LiquidatePositionExecutionPlanFragment: FragmentDocumentFor<
  LiquidatePositionExecutionPlan,
  'LiquidatePositionExecutionPlan'
> = graphql(
  `fragment LiquidatePositionExecutionPlan on LiquidatePositionExecutionPlan {
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

/**
 * @internal
 */
export const LiquidatePositionQuery = graphql(
  `query LiquidatePosition($request: LiquidatePositionRequest!) {
    value: liquidatePosition(request: $request) {
      ...LiquidatePositionExecutionPlan
    }
  }`,
  [LiquidatePositionExecutionPlanFragment],
);
export type LiquidatePositionRequest = RequestOf<typeof LiquidatePositionQuery>;

/**
 * @internal
 */
export const SetSpokeUserPositionManagerQuery = graphql(
  `query SetSpokeUserPositionManager($request: SetSpokeUserPositionManagerRequest!) {
    value: setSpokeUserPositionManager(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type SetSpokeUserPositionManagerRequest = RequestOf<
  typeof SetSpokeUserPositionManagerQuery
>;

/**
 * @internal
 */
export const SetUserSupplyAsCollateralQuery = graphql(
  `query SetUserSupplyAsCollateral($request: SetUserSupplyAsCollateralRequest!) {
    value: setUserSupplyAsCollateral(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type SetUserSupplyAsCollateralRequest = RequestOf<
  typeof SetUserSupplyAsCollateralQuery
>;

/**
 * @internal
 */
export const RenounceSpokeUserPositionManagerQuery = graphql(
  `query RenounceSpokeUserPositionManager($request: RenounceSpokeUserPositionManagerRequest!) {
    value: renounceSpokeUserPositionManager(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type RenounceSpokeUserPositionManagerRequest = RequestOf<
  typeof RenounceSpokeUserPositionManagerQuery
>;

/**
 * @internal
 */
export const UpdateUserRiskPremiumQuery = graphql(
  `query UpdateUserRiskPremium($request: UpdateUserRiskPremiumRequest!) {
    value: updateUserRiskPremium(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type UpdateUserRiskPremiumRequest = RequestOf<
  typeof UpdateUserRiskPremiumQuery
>;

export type PreviewUserPosition = {
  __typename: 'PreviewUserPosition';
  id: UserPositionId;
  healthFactor: HealthFactorResult;
  portfolioApy: PercentNumberVariation;
  netApy: PercentNumberVariation;
  riskPremium: PercentNumberVariation;
  netCollateral: FiatAmountValueVariation;
  netBalance: FiatAmountValueVariation;
  /**
   * @deprecated Use `netApy` instead. Removal slated for week commencing 27th October 2025.
   */
  positionApy: PercentNumberVariation;
};
export const PreviewUserPositionFragment: FragmentDocumentFor<
  PreviewUserPosition,
  'PreviewUserPosition'
> = graphql(
  `fragment PreviewUserPosition on PreviewUserPosition {
    __typename
    id
    healthFactor {
      ...HealthFactorResult
    }
    portfolioApy {
      ...PercentNumberVariation
    }
    netApy {
      ...PercentNumberVariation
    }
    riskPremium {
      ...PercentNumberVariation
    }
    netCollateral(currency: $currency) {
      ...FiatAmountValueVariation
    }
    netBalance(currency: $currency) {
      ...FiatAmountValueVariation
    }
    positionApy: portfolioApy {
      ...PercentNumberVariation
    }
  }`,
  [
    HealthFactorResultFragment,
    PercentNumberVariationFragment,
    FiatAmountValueVariationFragment,
  ],
);

/**
 * @internal
 */
export const PreviewQuery = graphql(
  `query Preview($request: PreviewRequest!, $currency: Currency! = USD) {
    value: preview(request: $request) {
      ...PreviewUserPosition
    }
  }`,
  [PreviewUserPositionFragment],
);
export type PreviewRequest = RequestOf<typeof PreviewQuery>;

/**
 * @internal
 */
export const UpdateUserDynamicConfigQuery = graphql(
  `query UpdateUserDynamicConfig($request: UpdateUserDynamicConfigRequest!) {
    value: updateUserDynamicConfig(request: $request) {
      ...TransactionRequest
      }
  }`,
  [TransactionRequestFragment],
);
export type UpdateUserDynamicConfigRequest = RequestOf<
  typeof UpdateUserDynamicConfigQuery
>;

export type LiquidatePositionDebtAmount = ReturnType<
  typeof graphql.scalar<'LiquidatePositionDebtAmount'>
>;
export type PreviewAction = ReturnType<typeof graphql.scalar<'PreviewAction'>>;
export type RepayAmountInputWithPermit = ReturnType<
  typeof graphql.scalar<'RepayAmountInputWithPermit'>
>;
export type RepayErc20AmountInputWithPermit = ReturnType<
  typeof graphql.scalar<'RepayErc20AmountInputWithPermit'>
>;
export type WithdrawReserveAmountInput = ReturnType<
  typeof graphql.scalar<'WithdrawReserveAmountInput'>
>;

// Activity Fragments
export type BorrowActivity = {
  __typename: 'BorrowActivity';
  id: ID;
  user: EvmAddress;
  timestamp: DateTime;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  borrowed: Erc20Amount;
  chain: Chain;
  /**
   * @deprecated Use `borrowed` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: Erc20Amount;
};
export const BorrowActivityFragment: FragmentDocumentFor<
  BorrowActivity,
  'BorrowActivity'
> = graphql(
  `fragment BorrowActivity on BorrowActivity {
    __typename
    id
    user
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    borrowed {
      ...Erc20Amount
    }
    chain {
      ...Chain
    }
    amount: borrowed {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);

export type SupplyActivity = {
  __typename: 'SupplyActivity';
  id: ID;
  user: EvmAddress;
  timestamp: DateTime;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  supplied: Erc20Amount;
  chain: Chain;
  amount: Erc20Amount;
};
export const SupplyActivityFragment: FragmentDocumentFor<
  SupplyActivity,
  'SupplyActivity'
> = graphql(
  `fragment SupplyActivity on SupplyActivity {
    __typename
    id
    user
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    supplied {
      ...Erc20Amount
    }
    chain {
      ...Chain
    }
    amount: supplied {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);

export type WithdrawActivity = {
  __typename: 'WithdrawActivity';
  id: ID;
  user: EvmAddress;
  timestamp: DateTime;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  withdrawn: Erc20Amount;
  chain: Chain;
  /**
   * @deprecated Use `withdrawn` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: Erc20Amount;
};
export const WithdrawActivityFragment: FragmentDocumentFor<
  WithdrawActivity,
  'WithdrawActivity'
> = graphql(
  `fragment WithdrawActivity on WithdrawActivity {
    __typename
    id
    user
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    withdrawn {
      ...Erc20Amount
    }
    chain {
      ...Chain
    }
    amount: withdrawn {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);

export type RepayActivity = {
  __typename: 'RepayActivity';
  id: ID;
  user: EvmAddress;
  timestamp: DateTime;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  repaid: Erc20Amount;
  chain: Chain;
  /**
   * @deprecated Use `repaid` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: Erc20Amount;
};
export const RepayActivityFragment: FragmentDocumentFor<
  RepayActivity,
  'RepayActivity'
> = graphql(
  `fragment RepayActivity on RepayActivity {
    __typename
    id
    user
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    repaid {
      ...Erc20Amount
    }
    chain {
      ...Chain
    }
    amount: repaid {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);

export type LiquidatedActivity = {
  __typename: 'LiquidatedActivity';
  id: ID;
  user: EvmAddress;
  timestamp: DateTime;
  txHash: TxHash;
  spoke: Spoke;
  collateralReserve: ReserveInfo;
  debtReserve: ReserveInfo;
  collateral: Erc20Amount;
  debt: Erc20Amount;
  liquidator: EvmAddress;
  chain: Chain;
  /**
   * @deprecated Use `collateral` instead. Removal slated for week commencing 27th October 2025.
   */
  collateralAmount: Erc20Amount;
  /**
   * @deprecated Use `debt` instead. Removal slated for week commencing 27th October 2025.
   */
  debtAmount: Erc20Amount;
};
export const LiquidatedActivityFragment: FragmentDocumentFor<
  LiquidatedActivity,
  'LiquidatedActivity'
> = graphql(
  `fragment LiquidatedActivity on LiquidatedActivity {
    __typename
    id
    user
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    collateralReserve {
      ...ReserveInfo
    }
    debtReserve {
      ...ReserveInfo
    }
    collateral {
      ...Erc20Amount
    }
    debt {
      ...Erc20Amount
    }
    liquidator
    chain {
      ...Chain
    }
    collateralAmount: collateral {
      ...Erc20Amount
    }
    debtAmount: debt {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);

export type SwapActivity = {
  __typename: 'SwapActivity';
  id: ID;
  user: EvmAddress;
  timestamp: DateTime;
  txHash: TxHash;
  desiredSell: TokenAmount;
  desiredBuy: TokenAmount;
  sold: TokenAmount;
  bought: TokenAmount;
  createdAt: DateTime;
  fulfilledAt: DateTime;
  explorerLink: string;
  chain: Chain;
  /**
   * @deprecated Use `desiredSell` instead. Removal slated for week commencing 27th October 2025.
   */
  sellAmount: TokenAmount;
  /**
   * @deprecated Use `desiredBuy` instead. Removal slated for week commencing 27th October 2025.
   */
  buyAmount: TokenAmount;
  /**
   * @deprecated Use `sold` instead. Removal slated for week commencing 27th October 2025.
   */
  executedSellAmount: TokenAmount;
  /**
   * @deprecated Use `bought` instead. Removal slated for week commencing 27th October 2025.
   */
  executedBuyAmount: TokenAmount;
};
export const SwapActivityFragment: FragmentDocumentFor<
  SwapActivity,
  'SwapActivity'
> = graphql(
  `fragment SwapActivity on SwapActivity {
    __typename
    id
    user
    timestamp
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
    chain {
      ...Chain
    }
    sellAmount: desiredSell {
      ...TokenAmount
    }
    buyAmount: desiredBuy {
      ...TokenAmount
    }
    executedSellAmount: sold {
      ...TokenAmount
    }
    executedBuyAmount: bought {
      ...TokenAmount
    }
  }`,
  [TokenAmountFragment, ChainFragment],
);

export const ActivityItemFragment = graphql(
  `fragment ActivityItem on ActivityItem {
    __typename
    ... on BorrowActivity {
      ...BorrowActivity
    }
    ... on SupplyActivity {
      ...SupplyActivity
    }
    ... on WithdrawActivity {
      ...WithdrawActivity
    }
    ... on RepayActivity {
      ...RepayActivity
    }
    ... on LiquidatedActivity {
      ...LiquidatedActivity
    }
    ... on SwapActivity {
      ...SwapActivity
    }
  }`,
  [
    BorrowActivityFragment,
    SupplyActivityFragment,
    WithdrawActivityFragment,
    RepayActivityFragment,
    LiquidatedActivityFragment,
    SwapActivityFragment,
  ],
);
export type ActivityItem = FragmentOf<typeof ActivityItemFragment>;
/**
 * @deprecated Use {@link ActivityItem} instead. Removal slated for week commencing 27th October 2025.
 */
export type UserHistoryItem = ActivityItem;

export const PaginatedActivitiesResultFragment = graphql(
  `fragment PaginatedActivitiesResult on PaginatedActivitiesResult {
    __typename
    items {
      ...ActivityItem
    }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [ActivityItemFragment, PaginatedResultInfoFragment],
);
export type PaginatedActivitiesResult = FragmentOf<
  typeof PaginatedActivitiesResultFragment
>;

/**
 * @internal
 */
export const ActivitiesQuery = graphql(
  `query Activities($request: ActivitiesRequest!, $currency: Currency!) {
    value: activities(request: $request) {
      ...PaginatedActivitiesResult
    }
  }`,
  [PaginatedActivitiesResultFragment],
);
export type ActivitiesRequest = RequestOf<typeof ActivitiesQuery>;

export type ActivitiesRequestQuery = ReturnType<
  typeof graphql.scalar<'ActivitiesRequestQuery'>
>;
