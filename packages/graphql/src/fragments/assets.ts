import { type FragmentOf, graphql } from '../graphql';
import {
  Erc20AmountFragment,
  Erc20TokenFragment,
  PercentValueFragment,
} from './common';
import { HubFragment } from './hubs';

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
        ...Erc20Amount
      }
    }`,
  [Erc20AmountFragment],
);
export type HubAssetUserState = FragmentOf<typeof HubAssetUserStateFragment>;

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
