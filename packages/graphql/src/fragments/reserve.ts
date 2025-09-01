import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ChainFragment } from './chain';
import {
  DecimalValueFragment,
  Erc20AmountFragment,
  Erc20TokenFragment,
  PercentValueFragment,
  TokenAmountFragment,
} from './common';

export const SpokeConfigFragment = graphql(
  `fragment SpokeConfig on SpokeConfig {
    __typename
    canSetPositionManager
    active
  }`,
);
export type SpokeConfig = FragmentOf<typeof SpokeConfigFragment>;

export const SpokeFragment = graphql(
  `fragment Spoke on Spoke {
    __typename
    name
    address
    chain {
      ...Chain
    }
    config {
      ...SpokeConfig
    }
  }`,
  [ChainFragment, SpokeConfigFragment],
);

export type Spoke = FragmentOf<typeof SpokeFragment>;

export const ReserveSettingsFragment = graphql(
  `fragment ReserveSettings on ReserveSettings {
    __typename
    collateralFactor {
      ...PercentValue
    }
    liquidationBonus {
      ...PercentValue
    }
    collateralRisk {
      ...PercentValue
    }
    borrowable
    collateral
  }`,
  [PercentValueFragment],
);
export type ReserveSettings = FragmentOf<typeof ReserveSettingsFragment>;

export const ReserveStatusFragment = graphql(
  `fragment ReserveStatus on ReserveStatus {
    __typename
    frozen
    paused
  }`,
);
export type ReserveStatus = FragmentOf<typeof ReserveStatusFragment>;

export const ReserveSummaryFragment = graphql(
  `fragment ReserveSummary on ReserveSummary {
    __typename
    supplied {
      ...Erc20Amount
    }
    borrowed {
      ...Erc20Amount
    }
    supplyApy {
      ...PercentValue
    }
    borrowApy {
      ...PercentValue
    }
  }`,
  [Erc20AmountFragment, PercentValueFragment],
);
export type ReserveSummary = FragmentOf<typeof ReserveSummaryFragment>;

export const ReserveUserStateFragment = graphql(
  `fragment ReserveUserState on ReserveUserState {
    __typename
    balance {
      ...Erc20Amount
    }
    suppliable {
      ...Erc20Amount
    }
    borrowable {
      ...Erc20Amount
    }
    borrowApy {
      ...PercentValue
    }
  }`,
  [Erc20AmountFragment, PercentValueFragment],
);
export type ReserveUserState = FragmentOf<typeof ReserveUserStateFragment>;

export const HubAssetSummaryFragment = graphql(
  `fragment HubAssetSummary on HubAssetSummary {
    __typename
    supplied
    borrowed
    availableLiquidity
    supplyApy {
      ...PercentValue
    }
    borrowApy {
      ...PercentValue
    }
    netApy {
      ...PercentValue
    }
    utilizationRate {
      ...PercentValue
    }
  }`,
  [PercentValueFragment],
);
export type HubAssetSummary = FragmentOf<typeof HubAssetSummaryFragment>;

export const HubAssetSettingsFragment = graphql(
  `fragment HubAssetSettings on HubAssetSettings {
    __typename
    feeReceiver
    liquidityFee {
      ...PercentValue
    }
    irStrategy
    reinvestmentStrategy
  }`,
  [PercentValueFragment],
);
export type HubAssetSettings = FragmentOf<typeof HubAssetSettingsFragment>;

export const HubAssetUserStateFragment = graphql(
  `fragment HubAssetUserState on HubAssetUserState {
    __typename
    balance {
      ...TokenAmount
    }
  }`,
  [TokenAmountFragment],
);
export type HubAssetUserState = FragmentOf<typeof HubAssetUserStateFragment>;

export const FiatAmountFragment = graphql(
  `fragment FiatAmount on FiatAmount {
    __typename
    value {
      ...DecimalValue
    }
    name
    symbol
  }`,
  [DecimalValueFragment],
);
export type FiatAmount = FragmentOf<typeof FiatAmountFragment>;

export const HubFragment = graphql(
  `fragment Hub on Hub {
    __typename
    name
    address
    chain {
      ...Chain
    }
    totalSupplied {
      ...FiatAmount
    }
    totalSupplyCap {
      ...FiatAmount
    }
    supplyUtilizationRate {
      ...PercentValue
    }
    totalBorrowed {
      ...FiatAmount
    }
    totalBorrowCap {
      ...FiatAmount
    }
    borrowUtilizationRate {
      ...PercentValue
    }
  }`,
  [ChainFragment, FiatAmountFragment, PercentValueFragment],
);
export type Hub = FragmentOf<typeof HubFragment>;

export const HubAssetFragment = graphql(
  `fragment HubAsset on HubAsset {
    __typename
    assetId
    hub {
      ...Hub
    }
    underlying {
      ...Erc20Token
    }
    summary {
      ...HubAssetSummary
    }
    settings {
      ...HubAssetSettings
    }
    userState {
      ...HubAssetUserState
    }
  }`,
  [
    HubFragment,
    Erc20TokenFragment,
    HubAssetSummaryFragment,
    HubAssetSettingsFragment,
    HubAssetUserStateFragment,
  ],
);
export type HubAsset = FragmentOf<typeof HubAssetFragment>;

export const ReserveFragment = graphql(
  `fragment Reserve on Reserve {
    __typename
    id
    spoke {
      ...Spoke
    }
    assetId
    borrowCap
    supplyCap
    chain {
      ...Chain
    }
    summary {
      ...ReserveSummary
    }
    settings {
      ...ReserveSettings
    }
    status {
      ...ReserveStatus
    }
    canBorrow
    canUseAsCollateral
    userState {
      ...ReserveUserState
    }
    asset {
      ...HubAsset
    }
  }`,
  [
    SpokeFragment,
    ChainFragment,
    ReserveSummaryFragment,
    ReserveSettingsFragment,
    ReserveStatusFragment,
    ReserveUserStateFragment,
    HubAssetFragment,
  ],
);
export type Reserve = FragmentOf<typeof ReserveFragment>;
