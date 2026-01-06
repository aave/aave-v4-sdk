import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  DecimalNumberFragment,
  Erc20AmountFragment,
  Erc20TokenFragment,
  ExchangeAmountFragment,
  ExchangeAmountWithChangeFragment,
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
      ...ExchangeAmountWithChange
    }
    totalCollateral(currency: $currency) {
      ...ExchangeAmount
    }
    totalSupplied(currency: $currency) {
      ...ExchangeAmount
    }
    totalDebt(currency: $currency) {
      ...ExchangeAmount
    }
    netApy {
      ...PercentNumber
    }
    netFeeEarned {
      ...ExchangeAmount
    }
    lowestHealthFactor
  }`,
  [
    ExchangeAmountWithChangeFragment,
    ExchangeAmountFragment,
    PercentNumberFragment,
  ],
);
export type UserSummary = FragmentOf<typeof UserSummaryFragment>;

export const UserRiskPremiumBreakdownItemFragment = graphql(
  `fragment UserRiskPremiumBreakdownItem on UserRiskPremiumBreakdownItem {
    __typename
    token {
      ...Erc20Token
    }
    currentRiskPremiumWeight {
      ...PercentNumber
    }
    latestRiskPremiumWeight {
      ...PercentNumber
    }
    collateral {
      ...PercentNumber
    }
  }`,
  [Erc20TokenFragment, PercentNumberFragment],
);
export type UserRiskPremiumBreakdownItem = FragmentOf<
  typeof UserRiskPremiumBreakdownItemFragment
>;

export const UserPositionRiskPremiumFragment = graphql(
  `fragment UserPositionRiskPremium on UserPositionRiskPremium {
    __typename
    current {
      ...PercentNumber
    }
    latest {
      ...PercentNumber
    }
    breakdown {
      ...UserRiskPremiumBreakdownItem
    }
  }`,
  [PercentNumberFragment, UserRiskPremiumBreakdownItemFragment],
);
export type UserPositionRiskPremium = FragmentOf<
  typeof UserPositionRiskPremiumFragment
>;

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
      ...ExchangeAmountWithChange
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalCollateral(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalSupplied(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalDebt(currency: $currency) {
      ...ExchangeAmountWithChange
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
      ...UserPositionRiskPremium
    }
    liquidationPrice(currency: $currency) {
      ...ExchangeAmount
    }
    borrowingPower(currency: $currency) {
      ...ExchangeAmount
    }
    canUpdateDynamicConfig
    netBalancePercentChange(window: $timeWindow) {
      ...PercentNumber
    }
    averageCollateralFactor {
      ...PercentNumber
    }
  }`,
  [
    SpokeFragment,
    PercentNumberFragment,
    ExchangeAmountWithChangeFragment,
    ExchangeAmountFragment,
    PercentNumberWithChangeFragment,
    HealthFactorWithChangeFragment,
    UserPositionRiskPremiumFragment,
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
    exchange(currency: $currency) {
      ...ExchangeAmount
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
    highestCollateralFactor: collateralFactor(metric: HIGHEST) {
      ...PercentNumber
    }
    lowestCollateralFactor: collateralFactor(metric: LOWEST) {
      ...PercentNumber
    }
  }`,
  [
    TokenInfoFragment,
    DecimalNumberFragment,
    TokenAmountFragment,
    ExchangeAmountFragment,
    PercentNumberFragment,
  ],
);
export type UserBalance = FragmentOf<typeof UserBalanceFragment>;

export const UserSummaryHistoryItemFragment = graphql(
  `fragment UserSummaryHistoryItem on UserSummaryHistoryItem {
    __typename
    netBalance(currency: $currency) {
      ...ExchangeAmount
    }
    borrows(currency: $currency) {
      ...ExchangeAmount
    }
    supplies(currency: $currency) {
      ...ExchangeAmount
    }
    healthFactor
    date
  }`,
  [ExchangeAmountFragment],
);
export type UserSummaryHistoryItem = FragmentOf<
  typeof UserSummaryHistoryItemFragment
>;

export const ApySampleFragment = graphql(
  `fragment ApySample on ApySample {
    __typename
    date
    avgRate {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type ApySample = FragmentOf<typeof ApySampleFragment>;
