import type { FragmentOf } from 'gql.tada';
import { ExecutionPlanFragment, TransactionRequestFragment } from './fragments';
import {
  BigDecimalVariationFragment,
  FiatAmountValueVariationFragment,
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

export const PreviewUserPositionResultFragment = graphql(
  `fragment PreviewUserPositionResult on PreviewUserPositionResult {
    __typename
    healthFactor {
      ...BigDecimalVariation
    }
    positionAPY {
      ...PercentValueVariation
    }
    netAPY {
      ...PercentValueVariation
    }
    riskPremium {
      ...PercentValueVariation
    }
    netCollateral {
      ...FiatAmountValueVariation
    }
    netDebt {
      ...FiatAmountValueVariation
    }
  }`,
  [
    BigDecimalVariationFragment,
    PercentValueVariationFragment,
    FiatAmountValueVariationFragment,
  ],
);
export type PreviewUserPositionResult = FragmentOf<
  typeof PreviewUserPositionResultFragment
>;

/**
 * @internal
 */
export const PreviewQuery = graphql(
  `query Preview($request: PreviewRequest!) {
    value: preview(request: $request) {
      ...PreviewUserPositionResult
    }
  }`,
  [PreviewUserPositionResultFragment],
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
