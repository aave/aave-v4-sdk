import {
  PaginatedUserHistoryResultFragment,
  UserBalanceFragment,
  UserBorrowItemFragment,
  UserPositionFragment,
  UserSummaryFragment,
  UserSummaryHistoryItemFragment,
  UserSupplyItemFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const UserSuppliesQuery = graphql(
  `query UserSupplies($request: UserSuppliesRequest!, $currency: Currency!) {
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
  `query UserBorrows($request: UserBorrowsRequest!, $currency: Currency!) {
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
export type UserBalancesRequestFilter = ReturnType<
  typeof graphql.scalar<'UserBalancesRequestFilter'>
>;

export type UserBalancesRequest = RequestOf<typeof UserBalancesQuery>;

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

/**
 * @internal
 */
export const UserHistoryQuery = graphql(
  `query UserHistory($request: UserHistoryRequest!, $currency: Currency!) {
    value: userHistory(request: $request) {
      ...PaginatedUserHistoryResult
    }
  }`,
  [PaginatedUserHistoryResultFragment],
);
export type UserHistoryRequest = RequestOf<typeof UserHistoryQuery>;

export type UserBalancesRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserBalancesRequestOrderBy'>
>;
export type UserBorrowsRequestQuery = ReturnType<
  typeof graphql.scalar<'UserBorrowsQueryRequest'>
>;
export type UserChains = ReturnType<typeof graphql.scalar<'UserChains'>>;
export type UserBorrowsRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserBorrowsRequestOrderBy'>
>;
export type UserHistoryFilter = ReturnType<
  typeof graphql.scalar<'UserHistoryFilter'>
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
  typeof graphql.scalar<'UserSuppliesQueryRequest'>
>;
export type UserSuppliesRequestOrderBy = ReturnType<
  typeof graphql.scalar<'UserSuppliesRequestOrderBy'>
>;
