import { type FragmentOf, graphql } from '../graphql';
import {
  Erc20AmountFragment,
  Erc20TokenFragment,
  PercentNumberFragment,
} from './common';
import { HubFragment } from './hubs';

export const HubAssetSummaryFragment = graphql(
  `fragment HubAssetSummary on HubAssetSummary {
      __typename
      supplied {
        ...Erc20Amount
      }
      borrowed {
        ...Erc20Amount
      }
      availableLiquidity {
        ...Erc20Amount
      }
      supplyApy {
        ...PercentNumber
      }
      borrowApy {
        ...PercentNumber
      }
      netApy {
        ...PercentNumber
      }
      utilizationRate {
        ...PercentNumber
      }
      reservesCount
      activeReservesCount
    }`,
  [Erc20AmountFragment, PercentNumberFragment],
);
export type HubAssetSummary = FragmentOf<typeof HubAssetSummaryFragment>;

export const HubAssetSettingsFragment = graphql(
  `fragment HubAssetSettings on HubAssetSettings {
      __typename
      feeReceiver
      liquidityFee {
        ...PercentNumber
      }
      irStrategy
      reinvestmentController
      optimalUtilizationRate {
        ...PercentNumber
      }
      baseBorrowRate {
        ...PercentNumber
      }
      slopeBelowOptimal {
        ...PercentNumber
      }
      slopeAboveOptimal {
        ...PercentNumber
      }
    }`,
  [PercentNumberFragment],
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

// Kept out of HubAssetUserState: that fragment is embedded in Reserve, and through it in the
// order and swap unions, whose inferred types are already at the TypeScript serialization limit.
export const HubAssetUserSuppliesFragment = graphql(
  `fragment HubAssetUserSupplies on HubAssetUserState {
      __typename
      supplied {
        ...Erc20Amount
      }
      collateralSupplied {
        ...Erc20Amount
      }
      earnings {
        ...Erc20Amount
      }
      collateralEarnings {
        ...Erc20Amount
      }
      supplyApy {
        ...PercentNumber
      }
    }`,
  [Erc20AmountFragment, PercentNumberFragment],
);
export type HubAssetUserSupplies = FragmentOf<
  typeof HubAssetUserSuppliesFragment
>;

export const HubAssetFragment = graphql(
  `fragment HubAsset on HubAsset {
      __typename
      id
      onchainAssetId
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
