import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  DecimalNumberFragment,
  Erc20AmountFragment,
  FiatAmountFragment,
  FiatAmountWithChangeFragment,
  HealthFactorWithChangeFragment,
  PercentNumberFragment,
  PercentNumberWithChangeFragment,
  TokenAmountFragment,
  TokenInfoFragment,
} from './common';
import { ReserveFragment } from './reserve';
import { SpokeFragment } from './spoke';

export const UserSupplyItemFragment = graphql(
  `fragment UserSupplyItem on UserSupplyItem {
    __typename
    id
    reserve {
      ...Reserve
    }
    interest {
      ...Erc20Amount
    }
    principal {
      ...Erc20Amount
    }
    withdrawable {
      ...Erc20Amount
    }
    isCollateral
    createdAt
  }`,
  [Erc20AmountFragment, ReserveFragment],
);
export type UserSupplyItem = FragmentOf<typeof UserSupplyItemFragment>;

export const UserBorrowItemFragment = graphql(
  `fragment UserBorrowItem on UserBorrowItem {
    __typename
    id
    principal {
      ...Erc20Amount
    }
    interest {
      ...Erc20Amount
    }
    debt {
      ...Erc20Amount
    }
    reserve {
      ...Reserve
    }
    createdAt
  }`,
  [Erc20AmountFragment, ReserveFragment],
);
export type UserBorrowItem = FragmentOf<typeof UserBorrowItemFragment>;

export const UserSummaryFragment = graphql(
  `fragment UserSummary on UserSummary {
    __typename
    totalPositions
    netBalance(currency: $currency) {
      ...FiatAmountWithChange
    }
    totalCollateral(currency: $currency) {
      ...FiatAmount
    }
    totalSupplied(currency: $currency) {
      ...FiatAmount
    }
    totalDebt(currency: $currency) {
      ...FiatAmount
    }
    netApy {
      ...PercentNumber
    }
    netFeeEarned {
      ...FiatAmount
    }
    lowestHealthFactor
  }`,
  [FiatAmountWithChangeFragment, FiatAmountFragment, PercentNumberFragment],
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
    createdAt
    netApy {
      ...PercentNumber
    }
    netCollateral(currency: $currency) {
      ...FiatAmountWithChange
    }
    netBalance(currency: $currency) {
      ...FiatAmountWithChange
    }
    totalCollateral(currency: $currency) {
      ...FiatAmountWithChange
    }
    totalSupplied(currency: $currency) {
      ...FiatAmountWithChange
    }
    totalDebt(currency: $currency) {
      ...FiatAmountWithChange
    }
    netSupplyApy {
      ...PercentNumberWithChange
    }
    netBorrowApy {
      ...PercentNumberWithChange
    }
    healthFactor {
      ...HealthFactorWithChange
    }
    riskPremium {
      ...PercentNumber
    }
    betterRiskPremium {
      ...PercentNumber
    }
    netBalancePercentChange(window: $timeWindow){
      ...PercentNumber
    }
    averageCollateralFactor {
      ...PercentNumber
    }
  }`,
  [
    SpokeFragment,
    PercentNumberFragment,
    FiatAmountWithChangeFragment,
    PercentNumberWithChangeFragment,
    HealthFactorWithChangeFragment,
  ],
);
export type UserPosition = FragmentOf<typeof UserPositionFragment>;

export const UserBalanceFragment = graphql(
  `fragment UserBalance on UserBalance {
    __typename
    id
    info {
      ...TokenInfo
    }
    totalAmount {
      ...DecimalNumber
    }
    balances {
      ...TokenAmount
    }
    fiatAmount(currency: $currency) {
      ...FiatAmount
    }
    highestSupplyApy: supplyApy(metric: HIGHEST) {
      ...PercentNumber
    }
    highestBorrowApy: borrowApy(metric: HIGHEST) {
      ...PercentNumber
    }
    lowestSupplyApy: supplyApy(metric: LOWEST) {
      ...PercentNumber
    }
    lowestBorrowApy: borrowApy(metric: LOWEST) {
      ...PercentNumber
    }
  }`,
  [
    TokenInfoFragment,
    DecimalNumberFragment,
    TokenAmountFragment,
    FiatAmountFragment,
    PercentNumberFragment,
  ],
);
export type UserBalance = FragmentOf<typeof UserBalanceFragment>;

export const UserSummaryHistoryItemFragment = graphql(
  `fragment UserSummaryHistoryItem on UserSummaryHistoryItem {
    __typename
    netBalance(currency: $currency) {
      ...FiatAmount
    }
    borrows(currency: $currency) {
      ...FiatAmount
    }
    supplies(currency: $currency) {
      ...FiatAmount
    }
    healthFactor
    date
  }`,
  [FiatAmountFragment],
);
export type UserSummaryHistoryItem = FragmentOf<
  typeof UserSummaryHistoryItemFragment
>;

export const APYSampleFragment = graphql(
  `fragment APYSample on APYSample {
    __typename
    date
    avgRate {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type APYSample = FragmentOf<typeof APYSampleFragment>;
