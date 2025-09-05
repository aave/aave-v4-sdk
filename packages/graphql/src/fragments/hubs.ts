import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ChainFragment } from './chain';

import {
  Erc20TokenFragment,
  FiatAmountFragment,
  PercentValueFragment,
  TokenAmountFragment,
} from './common';

export const HubSummaryFragment = graphql(
  `fragment HubSummary on HubSummary {
    __typename
    totalBorrowed {
      ...FiatAmount
    }
    totalBorrowCap {
      ...FiatAmount
    }
    totalSupplied {
      ...FiatAmount
    }
    totalSupplyCap {
      ...FiatAmount
    }
  }`,
  [FiatAmountFragment],
);
export type HubSummary = FragmentOf<typeof HubSummaryFragment>;

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

export const HubFragment = graphql(
  `fragment Hub on Hub {
      __typename
      name
      address
      chain {
        ...Chain
      }
      summary(currency: USD) {
        ...HubSummary
      }
    }`,
  [ChainFragment, HubSummaryFragment],
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
