import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import {
  type DecimalValue,
  DecimalValueFragment,
  Erc20AmountFragment,
  type FiatAmount,
  FiatAmountFragment,
  FiatAmountWithChangeFragment,
  HealthFactorChangeFragment,
  PaginatedResultInfoFragment,
  type PercentValue,
  PercentValueFragment,
  PercentValueWithChangeFragment,
  type TokenAmount,
  TokenAmountFragment,
  type TokenInfo,
  TokenInfoFragment,
} from './common';
import { ReserveFragment, ReserveInfoFragment } from './reserve';
import { SpokeFragment } from './spoke';

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
      ...PercentValue
    }
    netFeeEarned {
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
      ...PercentValueWithChange
    }
    netBorrowApy {
      ...PercentValueWithChange
    }
    healthFactor {
      ...HealthFactorChange
    }
    riskPremium {
      ...PercentValue
    }
    betterRiskPremium {
      ...PercentValue
    }
    netBalancePercentChange(window: $timeWindow){
      ...PercentValue
    }
  }`,
  [
    SpokeFragment,
    PercentValueFragment,
    FiatAmountWithChangeFragment,
    PercentValueWithChangeFragment,
    HealthFactorChangeFragment,
  ],
);
export type UserPosition = FragmentOf<typeof UserPositionFragment>;

export interface UserBalance {
  __typename: 'UserBalance';
  info: TokenInfo;
  totalAmount: DecimalValue;
  balances: TokenAmount[];
  fiatAmount: FiatAmount;
  /**
   * @deprecated Use `highestSupplyApy` instead. Removal slated for week commencing 6th October 2025.
   */
  supplyApy: PercentValue;
  /**
   * @deprecated Use `highestBorrowApy` instead. Removal slated for week commencing 6th October 2025.
   */
  borrowApy: PercentValue;
  highestSupplyApy: PercentValue;
  highestBorrowApy: PercentValue;
  lowestSupplyApy: PercentValue;
  lowestBorrowApy: PercentValue;
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
      ...DecimalValue
    }
    balances {
      ...TokenAmount
    }
    fiatAmount(currency: $currency) {
      ...FiatAmount
    }
    supplyApy(metric: HIGHEST) {
      ...PercentValue
    }
    borrowApy(metric: HIGHEST) {
      ...PercentValue
    }
    highestSupplyApy: supplyApy(metric: HIGHEST) {
      ...PercentValue
    }
    highestBorrowApy: borrowApy(metric: HIGHEST) {
      ...PercentValue
    }
    lowestSupplyApy: supplyApy(metric: LOWEST) {
      ...PercentValue
    }
    lowestBorrowApy: borrowApy(metric: LOWEST) {
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

// Activity Fragments
export const BorrowActivityFragment = graphql(
  `fragment BorrowActivity on BorrowActivity {
    __typename
    id
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment],
);
export type BorrowActivity = FragmentOf<typeof BorrowActivityFragment>;

export const SupplyActivityFragment = graphql(
  `fragment SupplyActivity on SupplyActivity {
    __typename
    id
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment],
);
export type SupplyActivity = FragmentOf<typeof SupplyActivityFragment>;

export const WithdrawActivityFragment = graphql(
  `fragment WithdrawActivity on WithdrawActivity {
    __typename
    id
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment],
);
export type WithdrawActivity = FragmentOf<typeof WithdrawActivityFragment>;

export const RepayActivityFragment = graphql(
  `fragment RepayActivity on RepayActivity {
    __typename
    id
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    reserve {
      ...ReserveInfo
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment],
);
export type RepayActivity = FragmentOf<typeof RepayActivityFragment>;

export const LiquidatedActivityFragment = graphql(
  `fragment LiquidatedActivity on LiquidatedActivity {
    __typename
    id
    timestamp
    txHash
    spoke {
      ...Spoke
    }
    collateralReserve {
      ...ReserveInfo
    }
    debtReserve {
      ...ReserveInfo
    }
    collateralAmount {
      ...Erc20Amount
    }
    debtAmount {
      ...Erc20Amount
    }
    liquidator
  }`,
  [SpokeFragment, Erc20AmountFragment, ReserveInfoFragment],
);
export type LiquidatedActivity = FragmentOf<typeof LiquidatedActivityFragment>;

export const SwapActivityFragment = graphql(
  `fragment SwapActivity on SwapActivity {
    __typename
    id
    timestamp
    txHash
    sellAmount {
      ...TokenAmount
    }
    buyAmount {
      ...TokenAmount
    }
    executedSellAmount {
      ...TokenAmount
    }
    executedBuyAmount {
      ...TokenAmount
    }
    createdAt
    fulfilledAt
    explorerLink
  }`,
  [TokenAmountFragment],
);
export type SwapActivity = FragmentOf<typeof SwapActivityFragment>;

export const UserHistoryItemFragment = graphql(
  `fragment UserHistoryItem on UserHistoryItem {
    __typename
    ... on BorrowActivity {
      ...BorrowActivity
    }
    ... on SupplyActivity {
      ...SupplyActivity
    }
    ... on WithdrawActivity {
      ...WithdrawActivity
    }
    ... on RepayActivity {
      ...RepayActivity
    }
    ... on LiquidatedActivity {
      ...LiquidatedActivity
    }
    ... on SwapActivity {
      ...SwapActivity
    }
  }`,
  [
    BorrowActivityFragment,
    SupplyActivityFragment,
    WithdrawActivityFragment,
    RepayActivityFragment,
    LiquidatedActivityFragment,
    SwapActivityFragment,
  ],
);
export type UserHistoryItem = FragmentOf<typeof UserHistoryItemFragment>;

export const PaginatedUserHistoryResultFragment = graphql(
  `fragment PaginatedUserHistoryResult on PaginatedUserHistoryResult {
    __typename
    items {
      ...UserHistoryItem
    }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [UserHistoryItemFragment, PaginatedResultInfoFragment],
);
export type PaginatedUserHistoryResult = FragmentOf<
  typeof PaginatedUserHistoryResultFragment
>;

export const UserSummaryHistoryItemFragment = graphql(
  `fragment UserSummaryHistoryItem on UserSummaryHistoryItem {
    __typename
    netBalance {
      ...FiatAmount
    }
    borrows {
      ...FiatAmount
    }
    supplies {
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
      ...PercentValue
    }
  }`,
  [PercentValueFragment],
);
export type APYSample = FragmentOf<typeof APYSampleFragment>;
