import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  BigDecimalWithChangeFragment,
  DecimalValueFragment,
  Erc20AmountFragment,
  FiatAmountFragment,
  FiatAmountWithChangeFragment,
  PercentValueFragment,
  PercentValueWithChangeFragment,
  TokenAmountFragment,
  TokenInfoFragment,
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

export const UserBalanceFragment = graphql(
  `fragment UserBalance on UserBalance {
    __typename
    info {
      ...TokenInfo
    }
    totalAmount {
      ...DecimalValue
    }
    balances {
      ...TokenAmount
    }
    fiatAmount(currency: USD) {
      ...FiatAmount
    }
    supplyApy(metric: HIGHEST) {
      ...PercentValue
    }
    borrowApy(metric: HIGHEST) {
      ...PercentValue
    }
  }`,
  [
    TokenInfoFragment,
    DecimalValueFragment,
    TokenAmountFragment,
    FiatAmountFragment,
    PercentValueFragment,
  ],
);
export type UserBalance = FragmentOf<typeof UserBalanceFragment>;
