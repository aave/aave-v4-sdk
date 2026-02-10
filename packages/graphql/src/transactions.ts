import type { ExtendWithOpaqueType } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import {
  ChainFragment,
  Erc20AmountFragment,
  type Erc20ApprovalRequired,
  Erc20ApprovalRequiredFragment,
  Erc20TokenFragment,
  ExchangeAmountVariationFragment,
  ExecutionPlanFragment,
  HealthFactorResultFragment,
  type InsufficientBalanceError,
  InsufficientBalanceErrorFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  PercentNumberVariationFragment,
  PositionAmountFragment,
  ReserveInfoFragment,
  SpokeFragment,
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
export const SetUserSuppliesAsCollateralQuery = graphql(
  `query SetUserSuppliesAsCollateral($request: SetUserSuppliesAsCollateralRequest!) {
    value: setUserSuppliesAsCollateral(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type SetUserSuppliesAsCollateralRequest = RequestOf<
  typeof SetUserSuppliesAsCollateralQuery
>;

export type UserSupplyAsCollateral = ReturnType<
  typeof graphql.scalar<'UserSupplyAsCollateral'>
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
export const UpdateUserPositionConditionsQuery = graphql(
  `query UpdateUserPositionConditions($request: UpdateUserPositionConditionsRequest!) {
    value: updateUserPositionConditions(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type UpdateUserPositionConditionsRequest = RequestOf<
  typeof UpdateUserPositionConditionsQuery
>;

export const CollateralFactorVariationFragment = graphql(
  `fragment CollateralFactorVariation on CollateralFactorVariation {
    __typename
    reserveId
    token {
      ...Erc20Token
    }
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }`,
  [Erc20TokenFragment, PercentNumberFragment],
);
export type CollateralFactorVariation = FragmentOf<
  typeof CollateralFactorVariationFragment
>;

export const LiquidationFeeVariationFragment = graphql(
  `fragment LiquidationFeeVariation on LiquidationFeeVariation {
    __typename
    reserveId
    token {
      ...Erc20Token
    }
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }`,
  [Erc20TokenFragment, PercentNumberFragment],
);
export type LiquidationFeeVariation = FragmentOf<
  typeof LiquidationFeeVariationFragment
>;

export const MaxLiquidationBonusVariationFragment = graphql(
  `fragment MaxLiquidationBonusVariation on MaxLiquidationBonusVariation {
    __typename
    reserveId
    token {
      ...Erc20Token
    }
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }`,
  [Erc20TokenFragment, PercentNumberFragment],
);
export type MaxLiquidationBonusVariation = FragmentOf<
  typeof MaxLiquidationBonusVariationFragment
>;

export const UserPositionConditionVariationFragment = graphql(
  `fragment UserPositionConditionVariation on UserPositionConditionVariation {
    __typename
    ... on CollateralFactorVariation {
      ...CollateralFactorVariation
    }
    ... on LiquidationFeeVariation {
      ...LiquidationFeeVariation
    }
    ... on MaxLiquidationBonusVariation {
      ...MaxLiquidationBonusVariation
    }
  }`,
  [
    CollateralFactorVariationFragment,
    LiquidationFeeVariationFragment,
    MaxLiquidationBonusVariationFragment,
  ],
);
export type UserPositionConditionVariation = FragmentOf<
  typeof UserPositionConditionVariationFragment
>;

export const PreviewUserPositionFragment = graphql(
  `fragment PreviewUserPosition on PreviewUserPosition {
    __typename
    id
    healthFactor {
      ...HealthFactorResult
    }
    netApy {
      ...PercentNumberVariation
    }
    riskPremium {
      ...PercentNumberVariation
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountVariation
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountVariation
    }
    projectedEarnings {
      ...ExchangeAmountVariation
    }
    borrowingPower {
      ...ExchangeAmountVariation
    }
    otherConditions {
      ...UserPositionConditionVariation
    }
  }`,
  [
    HealthFactorResultFragment,
    PercentNumberVariationFragment,
    ExchangeAmountVariationFragment,
    UserPositionConditionVariationFragment,
  ],
);
export type PreviewUserPosition = FragmentOf<
  typeof PreviewUserPositionFragment
>;

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
export type PreviewAction = ReturnType<typeof graphql.scalar<'PreviewAction'>>;
export type PreviewRequest = RequestOf<typeof PreviewQuery>;

export type LiquidatePositionDebtAmount = ReturnType<
  typeof graphql.scalar<'LiquidatePositionDebtAmount'>
>;
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
export const PercentNumberChangeSnapshotFragment = graphql(
  `fragment PercentNumberChangeSnapshot on PercentNumberChangeSnapshot {
    __typename
    before {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type PercentNumberChangeSnapshot = FragmentOf<
  typeof PercentNumberChangeSnapshotFragment
>;

export const BorrowActivityFragment = graphql(
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
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);
export type BorrowActivity = FragmentOf<typeof BorrowActivityFragment>;

export const SupplyActivityFragment = graphql(
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
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);
export type SupplyActivity = FragmentOf<typeof SupplyActivityFragment>;

export const WithdrawActivityFragment = graphql(
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
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);
export type WithdrawActivity = FragmentOf<typeof WithdrawActivityFragment>;

export const RepayActivityFragment = graphql(
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
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);
export type RepayActivity = FragmentOf<typeof RepayActivityFragment>;

export const LiquidatedActivityFragment = graphql(
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
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment, ChainFragment],
);
export type LiquidatedActivity = FragmentOf<typeof LiquidatedActivityFragment>;

export const UsingAsCollateralActivityFragment = graphql(
  `fragment UsingAsCollateralActivity on UsingAsCollateralActivity {
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
    enabledAsCollateral
    chain {
      ...Chain
    }
  }`,
  [SpokeFragment, ReserveInfoFragment, ChainFragment],
);
export type UsingAsCollateralActivity = FragmentOf<
  typeof UsingAsCollateralActivityFragment
>;

export const UpdatedDynamicConfigActivityFragment = graphql(
  `fragment UpdatedDynamicConfigActivity on UpdatedDynamicConfigActivity {
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
    collateralFactor {
      ...PercentNumberChangeSnapshot
    }
    maxLiquidationBonus {
      ...PercentNumberChangeSnapshot
    }
    liquidationFee {
      ...PercentNumberChangeSnapshot
    }
    chain {
      ...Chain
    }
  }`,
  [
    SpokeFragment,
    ReserveInfoFragment,
    PercentNumberChangeSnapshotFragment,
    ChainFragment,
  ],
);
export type UpdatedDynamicConfigActivity = FragmentOf<
  typeof UpdatedDynamicConfigActivityFragment
>;

export const UpdatedRiskPremiumActivityFragment = graphql(
  `fragment UpdatedRiskPremiumActivity on UpdatedRiskPremiumActivity {
    __typename
    id
    user
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    premium {
      ...PercentNumberChangeSnapshot
    }
    chain {
      ...Chain
    }
  }`,
  [SpokeFragment, PercentNumberChangeSnapshotFragment, ChainFragment],
);
export type UpdatedRiskPremiumActivity = FragmentOf<
  typeof UpdatedRiskPremiumActivityFragment
>;

export const TokenSwapActivityFragment = graphql(
  `fragment TokenSwapActivity on TokenSwapActivity {
    __typename
    id
    user
    timestamp
    txHash
    chain {
      ...Chain
    }
    sell {
      ...TokenAmount
    }
    buy {
      ...TokenAmount
    }
    explorerUrl
    orderClass
    kind
    status
  }`,
  [ChainFragment, TokenAmountFragment],
);
export type TokenSwapActivity = FragmentOf<typeof TokenSwapActivityFragment>;

export const SupplySwapActivityFragment = graphql(
  `fragment SupplySwapActivity on SupplySwapActivity {
    __typename
    id
    user
    timestamp
    txHash
    chain {
      ...Chain
    }
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    explorerUrl
    orderClass
    kind
    status
  }`,
  [ChainFragment, PositionAmountFragment],
);
export type SupplySwapActivity = FragmentOf<typeof SupplySwapActivityFragment>;

export const BorrowSwapActivityFragment = graphql(
  `fragment BorrowSwapActivity on BorrowSwapActivity {
    __typename
    id
    user
    timestamp
    txHash
    chain {
      ...Chain
    }
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    explorerUrl
    orderClass
    kind
    status
  }`,
  [ChainFragment, PositionAmountFragment],
);
export type BorrowSwapActivity = FragmentOf<typeof BorrowSwapActivityFragment>;

export const RepayWithSupplyActivityFragment = graphql(
  `fragment RepayWithSupplyActivity on RepayWithSupplyActivity {
    __typename
    id
    user
    timestamp
    txHash
    chain {
      ...Chain
    }
    repay {
      ...PositionAmount
    }
    supply {
      ...PositionAmount
    }
    explorerUrl
    orderClass
    kind
    status
  }`,
  [ChainFragment, PositionAmountFragment],
);
export type RepayWithSupplyActivity = FragmentOf<
  typeof RepayWithSupplyActivityFragment
>;

export const WithdrawSwapActivityFragment = graphql(
  `fragment WithdrawSwapActivity on WithdrawSwapActivity {
    __typename
    id
    user
    timestamp
    txHash
    chain {
      ...Chain
    }
    withdraw {
      ...PositionAmount
    }
    buy {
      ...TokenAmount
    }
    explorerUrl
    orderClass
    kind
    status
  }`,
  [ChainFragment, PositionAmountFragment, TokenAmountFragment],
);
export type WithdrawSwapActivity = FragmentOf<
  typeof WithdrawSwapActivityFragment
>;

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
    ... on UsingAsCollateralActivity {
      ...UsingAsCollateralActivity
    }
    ... on UpdatedDynamicConfigActivity {
      ...UpdatedDynamicConfigActivity
    }
    ... on UpdatedRiskPremiumActivity {
      ...UpdatedRiskPremiumActivity
    }
    ... on TokenSwapActivity {
      ...TokenSwapActivity
    }
    ... on SupplySwapActivity {
      ...SupplySwapActivity
    }
    ... on BorrowSwapActivity {
      ...BorrowSwapActivity
    }
    ... on RepayWithSupplyActivity {
      ...RepayWithSupplyActivity
    }
    ... on WithdrawSwapActivity {
      ...WithdrawSwapActivity
    }
  }`,
  [
    BorrowActivityFragment,
    SupplyActivityFragment,
    WithdrawActivityFragment,
    RepayActivityFragment,
    LiquidatedActivityFragment,
    UsingAsCollateralActivityFragment,
    UpdatedDynamicConfigActivityFragment,
    UpdatedRiskPremiumActivityFragment,
    TokenSwapActivityFragment,
    SupplySwapActivityFragment,
    BorrowSwapActivityFragment,
    RepayWithSupplyActivityFragment,
    WithdrawSwapActivityFragment,
  ],
);
export type ActivityItem = ExtendWithOpaqueType<
  FragmentOf<typeof ActivityItemFragment>
>;

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
  `query Activities($request: ActivitiesRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
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
