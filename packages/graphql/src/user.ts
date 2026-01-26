import {
  UserBalanceFragment,
  UserBorrowItemFragment,
  UserPositionFragment,
  UserRiskPremiumBreakdownItemFragment,
  UserSummaryFragment,
  UserSummaryHistoryItemFragment,
  UserSupplyItemFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const UserSuppliesQuery = graphql(
  `query UserSupplies($request: UserSuppliesRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: userSupplies(request: $request) {
      ...UserSupplyItem
    }
  }`,
  [UserSupplyItemFragment],
);
export type UserSuppliesRequest = RequestOf<typeof UserSuppliesQuery>;

/**
 * @internal
 */
export const UserBorrowsQuery = graphql(
  `query UserBorrows($request: UserBorrowsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: userBorrows(request: $request) {
      ...UserBorrowItem
    }
  }`,
  [UserBorrowItemFragment],
);
export type UserBorrowsRequest = RequestOf<typeof UserBorrowsQuery>;

/**
 * @internal
 */
export const UserSummaryQuery = graphql(
  `query UserSummary($request: UserSummaryRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: userSummary(request: $request) {
      ...UserSummary
    }
  }`,
  [UserSummaryFragment],
);
export type UserSummaryRequest = RequestOf<typeof UserSummaryQuery>;

/**
 * @internal
 */
export const UserPositionsQuery = graphql(
  `query UserPositions($request: UserPositionsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: userPositions(request: $request) {
      ...UserPosition
    }
  }`,
  [UserPositionFragment],
);
export type UserPositionsRequest = RequestOf<typeof UserPositionsQuery>;

/**
 * @internal
 */
export const UserPositionQuery = graphql(
  `query UserPosition($request: UserPositionRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: userPosition(request: $request) {
      ...UserPosition
    }
  }`,
  [UserPositionFragment],
);
export type UserPositionRequest = RequestOf<typeof UserPositionQuery>;

/**
 * @internal
 */
export const UserBalancesQuery = graphql(
  `query UserBalances($request: UserBalancesRequest!, $currency: Currency!) {
    value: userBalances(request: $request) {
      ...UserBalance
    }
  }`,
  [UserBalanceFragment],
);
export type UserBalancesRequest = RequestOf<typeof UserBalancesQuery>;

export type UserBalancesRequestFilter = ReturnType<
  typeof graphql.scalar<'UserBalancesRequestFilter'>
>;
export type UserBalancesByChains = ReturnType<
  typeof graphql.scalar<'UserBalancesByChains'>
>;
export type UserBalancesByHub = ReturnType<
  typeof graphql.scalar<'UserBalancesByHub'>
>;
export type UserBalancesByHubId = ReturnType<
  typeof graphql.scalar<'UserBalancesByHubId'>
>;
export type UserBalancesBySpoke = ReturnType<
  typeof graphql.scalar<'UserBalancesBySpoke'>
>;
export type UserBalancesByUserPosition = ReturnType<
  typeof graphql.scalar<'UserBalancesByUserPosition'>
>;
export type UserBalancesByTokens = ReturnType<
  typeof graphql.scalar<'UserBalancesByTokens'>
>;

/**
 * @internal
 */
export const UserSummaryHistoryQuery = graphql(
  `query UserSummaryHistory($request: UserSummaryHistoryRequest!, $currency: Currency!) {
    value: userSummaryHistory(request: $request) {
      ...UserSummaryHistoryItem
    }
  }`,
  [UserSummaryHistoryItemFragment],
);
export type UserSummaryHistoryRequest = RequestOf<
  typeof UserSummaryHistoryQuery
>;
export type UserSpokeInput = ReturnType<
  typeof graphql.scalar<'UserSpokeInput'>
>;
export type UserBalancesRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserBalancesRequestOrderBy'>
>;
export type UserBorrowsRequestQuery = ReturnType<
  typeof graphql.scalar<'UserBorrowsRequestQuery'>
>;
export type UserToken = ReturnType<typeof graphql.scalar<'UserToken'>>;
export type UserChains = ReturnType<typeof graphql.scalar<'UserChains'>>;
export type UserBorrowsRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserBorrowsRequestOrderBy'>
>;
export type UserPositionsRequestFilter = ReturnType<
  typeof graphql.scalar<'UserPositionsRequestFilter'>
>;
export type UserPositionsRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserPositionsRequestOrderBy'>
>;
export type UserSummaryFilter = ReturnType<
  typeof graphql.scalar<'UserSummaryFilter'>
>;
export type UserSuppliesRequestQuery = ReturnType<
  typeof graphql.scalar<'UserSuppliesRequestQuery'>
>;
export type UserSuppliesRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserSuppliesRequestOrderBy'>
>;

/**
 * @internal
 */
export const UserRiskPremiumBreakdownQuery = graphql(
  `query UserRiskPremiumBreakdown($request: UserRiskPremiumBreakdownRequest!) {
      value: userRiskPremiumBreakdown(request: $request) {
        ...UserRiskPremiumBreakdownItem
      }
    }`,
  [UserRiskPremiumBreakdownItemFragment],
);
export type UserRiskPremiumBreakdownRequest = RequestOf<
  typeof UserRiskPremiumBreakdownQuery
>;

export type UserRiskPremiumBreakdownRequestQuery = ReturnType<
  typeof graphql.scalar<'UserRiskPremiumBreakdownRequestQuery'>
>;
export type UserHub = ReturnType<typeof graphql.scalar<'UserHub'>>;
export type UserHubInput = ReturnType<typeof graphql.scalar<'UserHubInput'>>;
export type ChainTokenInput = ReturnType<
  typeof graphql.scalar<'ChainTokenInput'>
>;
