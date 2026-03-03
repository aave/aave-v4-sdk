import {
  PaginatedStableVaultMovementsResultFragment,
  PaginatedStableVaultRateUsersResultFragment,
  StableVaultDepositExecutionPlanFragment,
  StableVaultFragment,
  StableVaultUserPositionFragment,
  StableVaultWithdrawExecutionPlanFragment,
  StableVaultWithdrawRedeemExecutionPlanFragment,
  TransactionRequestFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const StableVaultQuery = graphql(
  `query StableVault($request: StableVaultRequest!) {
    value: stableVault(request: $request) {
      ...StableVault
    }
  }`,
  [StableVaultFragment],
);
export type StableVaultRequest = RequestOf<typeof StableVaultQuery>;

/**
 * @internal
 */
export const StableVaultsQuery = graphql(
  `query StableVaults($request: StableVaultsRequest!) {
    value: stableVaults(request: $request) {
      ...StableVault
    }
  }`,
  [StableVaultFragment],
);
export type StableVaultsRequest = RequestOf<typeof StableVaultsQuery>;

/**
 * @internal
 */
export const StableVaultRateUsersQuery = graphql(
  `query StableVaultRateUsers($request: StableVaultRateUsersRequest!) {
    value: stableVaultRateUsers(request: $request) {
      ...PaginatedStableVaultRateUsersResult
    }
  }`,
  [PaginatedStableVaultRateUsersResultFragment],
);
export type StableVaultRateUsersRequest = RequestOf<
  typeof StableVaultRateUsersQuery
>;

/**
 * @internal
 */
export const StableVaultAssignRateQuery = graphql(
  `query StableVaultAssignRate($request: StableVaultAssignRateRequest!) {
    value: stableVaultAssignRate(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type StableVaultAssignRateRequest = RequestOf<
  typeof StableVaultAssignRateQuery
>;

/**
 * @internal
 */
export const StableVaultUnassignRateQuery = graphql(
  `query StableVaultUnassignRate($request: StableVaultUnassignRateRequest!) {
    value: stableVaultUnassignRate(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type StableVaultUnassignRateRequest = RequestOf<
  typeof StableVaultUnassignRateQuery
>;

/**
 * @internal
 */
export const StableVaultClaimSurplusQuery = graphql(
  `query StableVaultClaimSurplus($request: StableVaultClaimSurplusRequest!) {
    value: stableVaultClaimSurplus(request: $request) {
      ...TransactionRequest
    }
  }`,
  [TransactionRequestFragment],
);
export type StableVaultClaimSurplusRequest = RequestOf<
  typeof StableVaultClaimSurplusQuery
>;

/**
 * @internal
 */
export const StableVaultMovementsQuery = graphql(
  `query StableVaultMovements($request: StableVaultMovementsRequest!) {
    value: stableVaultMovements(request: $request) {
      ...PaginatedStableVaultMovementsResult
    }
  }`,
  [PaginatedStableVaultMovementsResultFragment],
);
export type StableVaultMovementsRequest = RequestOf<
  typeof StableVaultMovementsQuery
>;

/**
 * @internal
 */
export const StableVaultDepositQuery = graphql(
  `query StableVaultDeposit($request: StableVaultDepositRequest!) {
    value: stableVaultDeposit(request: $request) {
      ...StableVaultDepositExecutionPlan
    }
  }`,
  [StableVaultDepositExecutionPlanFragment],
);
export type StableVaultDepositRequest = RequestOf<
  typeof StableVaultDepositQuery
>;

/**
 * @internal
 */
export const StableVaultWithdrawQuery = graphql(
  `query StableVaultWithdraw($request: StableVaultWithdrawRequest!) {
    value: stableVaultWithdraw(request: $request) {
      ...StableVaultWithdrawExecutionPlan
    }
  }`,
  [StableVaultWithdrawExecutionPlanFragment],
);
export type StableVaultWithdrawRequest = RequestOf<
  typeof StableVaultWithdrawQuery
>;

/**
 * @internal
 */
export const StableVaultClaimStatusQuery = graphql(
  `query StableVaultClaimStatus($request: StableVaultClaimStatusRequest!) {
    value: stableVaultClaimStatus(request: $request)
  }`,
);
export type StableVaultClaimStatusRequest = RequestOf<
  typeof StableVaultClaimStatusQuery
>;

/**
 * @internal
 */
export const StableVaultUserPositionsQuery = graphql(
  `query StableVaultUserPositions($request: StableVaultUserPositionsRequest!) {
    value: stableVaultUserPositions(request: $request) {
      ...StableVaultUserPosition
    }
  }`,
  [StableVaultUserPositionFragment],
);
export type StableVaultUserPositionsRequest = RequestOf<
  typeof StableVaultUserPositionsQuery
>;

/**
 * @internal
 */
export const StableVaultWithdrawRedeemMutation = graphql(
  `mutation StableVaultWithdrawRedeem($request: StableVaultWithdrawRedeemRequest!) {
    value: stableVaultWithdrawRedeem(request: $request) {
      ...StableVaultWithdrawRedeemExecutionPlan
    }
  }`,
  [StableVaultWithdrawRedeemExecutionPlanFragment],
);
export type StableVaultWithdrawRedeemRequest = RequestOf<
  typeof StableVaultWithdrawRedeemMutation
>;

export type StableVaultAmountInput = ReturnType<
  typeof graphql.scalar<'StableVaultAmountInput'>
>;
export type StableVaultAssignRateInput = ReturnType<
  typeof graphql.scalar<'StableVaultAssignRateRequest'>
>;
export type StableVaultClaimStatusInput = ReturnType<
  typeof graphql.scalar<'StableVaultClaimStatusRequest'>
>;
export type StableVaultClaimSurplusInput = ReturnType<
  typeof graphql.scalar<'StableVaultClaimSurplusRequest'>
>;
export type StableVaultDepositInput = ReturnType<
  typeof graphql.scalar<'StableVaultDepositRequest'>
>;
export type StableVaultInput = ReturnType<
  typeof graphql.scalar<'StableVaultInput'>
>;
export type StableVaultMovementsInput = ReturnType<
  typeof graphql.scalar<'StableVaultMovementsRequest'>
>;
export type StableVaultRateUsersInput = ReturnType<
  typeof graphql.scalar<'StableVaultRateUsersRequest'>
>;
export type StableVaultRequestInput = ReturnType<
  typeof graphql.scalar<'StableVaultRequest'>
>;
export type StableVaultUnassignRateInput = ReturnType<
  typeof graphql.scalar<'StableVaultUnassignRateRequest'>
>;
export type StableVaultUserPositionsRequestFilter = ReturnType<
  typeof graphql.scalar<'StableVaultUserPositionsRequestFilter'>
>;
export type StableVaultUserPositionsInput = ReturnType<
  typeof graphql.scalar<'StableVaultUserPositionsRequest'>
>;
export type StableVaultWithdrawInput = ReturnType<
  typeof graphql.scalar<'StableVaultWithdrawRequest'>
>;
export type StableVaultWithdrawRedeemInput = ReturnType<
  typeof graphql.scalar<'StableVaultWithdrawRedeemRequest'>
>;
export type StableVaultsRequestInput = ReturnType<
  typeof graphql.scalar<'StableVaultsRequest'>
>;
export type SurplusClaim = ReturnType<typeof graphql.scalar<'SurplusClaim'>>;
