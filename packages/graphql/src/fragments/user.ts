import type { FragmentOf } from 'gql.tada';
import { graphql, type RequestOf } from '../graphql';
import {
  BigDecimalWithChangeFragment,
  Erc20AmountFragment,
  FiatAmountFragment,
  FiatAmountWithChangeFragment,
  PaginatedResultInfoFragment,
  PercentValueFragment,
  PercentValueWithChangeFragment,
  TokenAmountFragment,
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
      id
      spoke {
        ...Spoke
      }
      asset {
        assetId
        underlying {
          info {
            name
            symbol
            icon
            decimals
          }
          contract
          chain {
            name
            icon
            chainId
            explorerUrl
            isTestnet
            nativeWrappedToken
            nativeInfo {
              name
              symbol
              icon
              decimals
            }
          }
        }
      }
      chain {
        name
        icon
        chainId
        explorerUrl
        isTestnet
        nativeWrappedToken
        nativeInfo {
          name
          symbol
          icon
          decimals
        }
      }
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment],
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
      id
      spoke {
        ...Spoke
      }
      asset {
        assetId
        underlying {
          info {
            name
            symbol
            icon
            decimals
          }
          contract
          chain {
            name
            icon
            chainId
            explorerUrl
            isTestnet
            nativeWrappedToken
            nativeInfo {
              name
              symbol
              icon
              decimals
            }
          }
        }
      }
      chain {
        name
        icon
        chainId
        explorerUrl
        isTestnet
        nativeWrappedToken
        nativeInfo {
          name
          symbol
          icon
          decimals
        }
      }
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment],
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
      id
      spoke {
        ...Spoke
      }
      asset {
        assetId
        underlying {
          info {
            name
            symbol
            icon
            decimals
          }
          contract
          chain {
            name
            icon
            chainId
            explorerUrl
            isTestnet
            nativeWrappedToken
            nativeInfo {
              name
              symbol
              icon
              decimals
            }
          }
        }
      }
      chain {
        name
        icon
        chainId
        explorerUrl
        isTestnet
        nativeWrappedToken
        nativeInfo {
          name
          symbol
          icon
          decimals
        }
      }
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment],
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
      id
      spoke {
        ...Spoke
      }
      asset {
        assetId
        underlying {
          info {
            name
            symbol
            icon
            decimals
          }
          contract
          chain {
            name
            icon
            chainId
            explorerUrl
            isTestnet
            nativeWrappedToken
            nativeInfo {
              name
              symbol
              icon
              decimals
            }
          }
        }
      }
      chain {
        name
        icon
        chainId
        explorerUrl
        isTestnet
        nativeWrappedToken
        nativeInfo {
          name
          symbol
          icon
          decimals
        }
      }
    }
    amount {
      ...Erc20Amount
    }
  }`,
  [SpokeFragment, Erc20AmountFragment],
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
      id
      spoke {
        ...Spoke
      }
      asset {
        assetId
        underlying {
          info {
            name
            symbol
            icon
            decimals
          }
          contract
          chain {
            name
            icon
            chainId
            explorerUrl
            isTestnet
            nativeWrappedToken
            nativeInfo {
              name
              symbol
              icon
              decimals
            }
          }
        }
      }
      chain {
        name
        icon
        chainId
        explorerUrl
        isTestnet
        nativeWrappedToken
        nativeInfo {
          name
          symbol
          icon
          decimals
        }
      }
    }
    debtReserve {
      id
      spoke {
        ...Spoke
      }
      asset {
        assetId
        underlying {
          info {
            name
            symbol
            icon
            decimals
          }
          contract
          chain {
            name
            icon
            chainId
            explorerUrl
            isTestnet
            nativeWrappedToken
            nativeInfo {
              name
              symbol
              icon
              decimals
            }
          }
        }
      }
      chain {
        name
        icon
        chainId
        explorerUrl
        isTestnet
        nativeWrappedToken
        nativeInfo {
          name
          symbol
          icon
          decimals
        }
      }
    }
    collateralAmount {
      ...Erc20Amount
    }
    debtAmount {
      ...Erc20Amount
    }
    liquidator
  }`,
  [SpokeFragment, Erc20AmountFragment],
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
