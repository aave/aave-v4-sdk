import {
  APYSampleFragment,
  HubAssetFragment,
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

/**
 * @internal
 */
export const UserSummaryHistoryQuery = graphql(
  `query UserSummaryHistory($request: UserSummaryHistoryRequest!) {
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
  `query UserHistory($request: UserHistoryRequest!) {
    value: userHistory(request: $request) {
      ...PaginatedUserHistoryResult
    }
  }`,
  [PaginatedUserHistoryResultFragment],
);
export type UserHistoryRequest = RequestOf<typeof UserHistoryQuery>;

/**
 * @internal
 */
export const BorrowApyHistoryQuery = graphql(
  `query BorrowApyHistory($request: BorrowAPYHistoryRequest!) {
    value: borrowApyHistory(request: $request) {
      ...APYSample
    }
  }`,
  [APYSampleFragment],
);
export type BorrowAPYHistoryRequest = RequestOf<typeof BorrowApyHistoryQuery>;

/**
 * @internal
 */
export const SupplyApyHistoryQuery = graphql(
  `query SupplyApyHistory($request: SupplyAPYHistoryRequest!) {
    value: supplyApyHistory(request: $request) {
      ...APYSample
    }
  }`,
  [APYSampleFragment],
);
export type SupplyAPYHistoryRequest = RequestOf<typeof SupplyApyHistoryQuery>;

/**
 * @internal
 */
export const HubAssetsQuery = graphql(
  `query HubAssets($request: HubAssetsRequest!) {
    value: hubAssets(request: $request) {
      ...HubAsset
    }
  }`,
  [HubAssetFragment],
);
export type HubAssetsRequest = RequestOf<typeof HubAssetsQuery>;
