import type { FragmentOf } from 'gql.tada';
import { graphql, type RequestOf } from '../graphql';
import {
  BigDecimalWithChangeFragment,
  Erc20AmountFragment,
  FiatAmountFragment,
  FiatAmountWithChangeFragment,
  PercentValueFragment,
  PercentValueWithChangeFragment,
} from './common';
import { ReserveFragment, SpokeFragment } from './reserve';

export const UserSupplyItemFragment = graphql(
  `fragment UserSupplyItem on UserSupplyItem {
    __typename
    amount {
      ...Erc20Amount
    }
    earned {
      ...Erc20Amount
    }
    isCollateral
    reserve {
      ...Reserve
    }
  }`,
  [Erc20AmountFragment, ReserveFragment],
);
export type UserSupplyItem = FragmentOf<typeof UserSupplyItemFragment>;

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

export const UserBorrowItemFragment = graphql(
  `fragment UserBorrowItem on UserBorrowItem {
    __typename
    amount {
      ...Erc20Amount
    }
    paid {
      ...Erc20Amount
    }
    reserve {
      ...Reserve
    }
  }`,
  [Erc20AmountFragment, ReserveFragment],
);
export type UserBorrowItem = FragmentOf<typeof UserBorrowItemFragment>;

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

export const UserSummaryFragment = graphql(
  `fragment UserSummary on UserSummary {
    __typename
    netBalance {
      ...FiatAmountWithChange
    }
    totalCollateral {
      ...FiatAmount
    }
    totalSupplied {
      ...FiatAmount
    }
    totalDebt {
      ...FiatAmount
    }
    netApy {
      ...PercentValue
    }
    netFeeEarned {
      ...FiatAmount
    }
    netPnl {
      ...FiatAmount
    }
    lowestHealthFactor
  }`,
  [FiatAmountWithChangeFragment, FiatAmountFragment, PercentValueFragment],
);
export type UserSummary = FragmentOf<typeof UserSummaryFragment>;

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

export const UserPositionFragment = graphql(
  `fragment UserPosition on UserPosition {
    __typename
    id
    spoke {
      ...Spoke
    }
    user
    netApy {
      ...PercentValue
    }
    netCollateral {
      ...FiatAmountWithChange
    }
    netBalance {
      ...FiatAmountWithChange
    }
    totalCollateral {
      ...FiatAmountWithChange
    }
    totalSupplied {
      ...FiatAmountWithChange
    }
    totalDebt {
      ...FiatAmountWithChange
    }
    netSupplyApy {
      ...PercentValueWithChange
    }
    netBorrowApy {
      ...PercentValueWithChange
    }
    healthFactor {
      ...BigDecimalWithChange
    }
    riskPremium {
      ...PercentValue
    }
    betterRiskPremium {
      ...PercentValue
    }
    supplies {
      ...UserSupplyItem
    }
    borrows {
      ...UserBorrowItem
    }
  }`,
  [
    SpokeFragment,
    PercentValueFragment,
    FiatAmountWithChangeFragment,
    PercentValueWithChangeFragment,
    BigDecimalWithChangeFragment,
    UserSupplyItemFragment,
    UserBorrowItemFragment,
  ],
);
export type UserPosition = FragmentOf<typeof UserPositionFragment>;

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
