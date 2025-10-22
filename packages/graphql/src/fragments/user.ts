import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  type DecimalNumber,
  DecimalNumberFragment,
  type Erc20Amount,
  Erc20AmountFragment,
  type FiatAmount,
  FiatAmountFragment,
  FiatAmountWithChangeFragment,
  HealthFactorWithChangeFragment,
  type PercentNumber,
  PercentNumberFragment,
  PercentNumberWithChangeFragment,
  type TokenAmount,
  TokenAmountFragment,
  type TokenInfo,
  TokenInfoFragment,
} from './common';
import { type Reserve, ReserveFragment } from './reserve';
import { SpokeFragment } from './spoke';

export type UserSupplyItem = {
  __typename: 'UserSupplyItem';
  reserve: Reserve;
  principal: Erc20Amount;
  withdrawable: Erc20Amount;
  isCollateral: boolean;
  /**
   * @deprecated Use `withdrawable` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: Erc20Amount;
};
export const UserSupplyItemFragment: FragmentDocumentFor<
  UserSupplyItem,
  'UserSupplyItem'
> = graphql(
  `fragment UserSupplyItem on UserSupplyItem {
    __typename
    reserve {
      ...Reserve
    }
    principal {
      ...Erc20Amount
    }
    withdrawable {
      ...Erc20Amount
    }
    isCollateral
    amount: withdrawable {
      ...Erc20Amount
    }
  }`,
  [Erc20AmountFragment, ReserveFragment],
);

export type UserBorrowItem = {
  __typename: 'UserBorrowItem';
  reserve: Reserve;
  principal: Erc20Amount;
  debt: Erc20Amount;
  /**
   * @deprecated Use `debt` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: Erc20Amount;
};
export const UserBorrowItemFragment: FragmentDocumentFor<
  UserBorrowItem,
  'UserBorrowItem'
> = graphql(
  `fragment UserBorrowItem on UserBorrowItem {
    __typename
    principal {
      ...Erc20Amount
    }
    debt {
      ...Erc20Amount
    }
    reserve {
      ...Reserve
    }
    amount: principal {
      ...Erc20Amount
    }
  }`,
  [Erc20AmountFragment, ReserveFragment],
);

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

export interface UserBalance {
  __typename: 'UserBalance';
  info: TokenInfo;
  totalAmount: DecimalNumber;
  balances: TokenAmount[];
  fiatAmount: FiatAmount;
  /**
   * @deprecated Use `highestSupplyApy` instead. Removal slated for week commencing 27th October 2025.
   */
  supplyApy: PercentNumber;
  /**
   * @deprecated Use `highestBorrowApy` instead. Removal slated for week commencing 27th October 2025.
   */
  borrowApy: PercentNumber;
  highestSupplyApy: PercentNumber;
  highestBorrowApy: PercentNumber;
  lowestSupplyApy: PercentNumber;
  lowestBorrowApy: PercentNumber;
}

export const UserBalanceFragment: FragmentDocumentFor<
  UserBalance,
  'UserBalance'
> = graphql(
  `fragment UserBalance on UserBalance {
    __typename
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
    supplyApy(metric: HIGHEST) {
      ...PercentNumber
    }
    borrowApy(metric: HIGHEST) {
      ...PercentNumber
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
