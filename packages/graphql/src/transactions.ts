import type { FragmentOf } from 'gql.tada';
import { ExecutionPlanFragment, TransactionRequestFragment } from './fragments';
import {
  FiatAmountValueVariationFragment,
  HealthFactorVariationFragment,
  PercentValueVariationFragment,
} from './fragments/common';
import { graphql, type RequestOf } from './graphql';

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

/**
 * @internal
 */
export const LiquidatePositionQuery = graphql(
  `query LiquidatePosition($request: LiquidatePositionRequest!) {
    value: liquidatePosition(request: $request) {
      ...ExecutionPlan
    }
  }`,
  [ExecutionPlanFragment],
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
      ...HealthFactorVariation
    }
    positionApy {
      ...PercentValueVariation
    }
    netApy {
      ...PercentValueVariation
    }
    riskPremium {
      ...PercentValueVariation
    }
    netCollateral(currency: $currency) {
      ...FiatAmountValueVariation
    }
    netBalance(currency: $currency) {
      ...FiatAmountValueVariation
    }
  }`,
  [
    HealthFactorVariationFragment,
    PercentValueVariationFragment,
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
