import type { ExtendWithOpaqueType, OpaqueTypename, TxHash } from '@aave/types';
import type { FragmentOf } from 'gql.tada';
import {
  ChainFragment,
  Erc20AmountFragment,
  type Erc20ApprovalRequired,
  Erc20ApprovalRequiredFragment,
  ExecutionPlanFragment,
  FiatAmountValueVariationFragment,
  HealthFactorResultFragment,
  type InsufficientBalanceError,
  InsufficientBalanceErrorFragment,
  PaginatedResultInfoFragment,
  PercentNumberVariationFragment,
  ReserveInfoFragment,
  SpokeFragment,
  type TransactionRequest,
  TransactionRequestFragment,
} from './fragments';
import { type FragmentDocumentFor, graphql, type RequestOf } from './graphql';
import type { ID } from './id';

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
      ...FiatAmountValueVariation
    }
    netBalance(currency: $currency) {
      ...FiatAmountValueVariation
    }
  }`,
  [
    HealthFactorResultFragment,
    PercentNumberVariationFragment,
    FiatAmountValueVariationFragment,
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
  }`,
  [
    BorrowActivityFragment,
    SupplyActivityFragment,
    WithdrawActivityFragment,
    RepayActivityFragment,
    LiquidatedActivityFragment,
    UsingAsCollateralActivityFragment,
  ],
);
export type ActivityItem = ExtendWithOpaqueType<
  FragmentOf<typeof ActivityItemFragment>,
  {
    __typename: OpaqueTypename;
    id: ID;
    timestamp: Date;
    txHash: TxHash;
  }
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
