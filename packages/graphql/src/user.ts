import {
  UserBalanceFragment,
  UserBorrowItemFragment,
  UserPositionFragment,
  UserSummaryFragment,
  UserSupplyItemFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const UserSuppliesQuery = graphql(
  `query UserSupplies($request: UserSuppliesRequest!) {
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
  `query UserBorrows($request: UserBorrowsRequest!) {
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
  `query UserSummary($request: UserSummaryRequest!) {
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
  `query UserPositions($request: UserPositionsRequest!) {
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
  `query UserPosition($request: UserPositionRequest!) {
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
  `query UserBalances($request: UserBalancesRequest!) {
    value: userBalances(request: $request) {
      ...UserBalance
    }
  }`,
  [UserBalanceFragment],
);
export type UserBalancesRequest = RequestOf<typeof UserBalancesQuery>;
