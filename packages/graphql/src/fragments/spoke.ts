import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  ChainFragment,
  ExchangeAmountFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
} from './common';
import { HubFragment } from './hubs';

export const SpokeLiquidationConfigFragment = graphql(
  `fragment SpokeLiquidationConfig on SpokeLiquidationConfig {
    __typename
    targetHealthFactor
    healthFactorForMaxBonus
    liquidationBonusFactor {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);

export type SpokeLiquidationConfig = FragmentOf<
  typeof SpokeLiquidationConfigFragment
>;

export const SpokeSummaryFragment = graphql(
  `fragment SpokeSummary on SpokeSummary {
    __typename
    totalBorrowed {
      ...ExchangeAmount
    }
    totalBorrowCap {
      ...ExchangeAmount
    }
    totalSupplied {
      ...ExchangeAmount
    }
    totalSupplyCap {
      ...ExchangeAmount
    }
    utilizationRate {
      ...PercentNumber
    }
    availableLiquidity {
      ...ExchangeAmount
    }
    uniqueAssets
    connectedHubs
  }`,
  [ExchangeAmountFragment, PercentNumberFragment],
);

export type SpokeSummary = FragmentOf<typeof SpokeSummaryFragment>;

export const SpokeConnectedHubSummaryFragment = graphql(
  `fragment SpokeConnectedHubSummary on SpokeConnectedHubSummary {
    __typename
    totalBorrowed {
      ...ExchangeAmount
    }
    creditLine {
      ...ExchangeAmount
    }
    creditUsed {
      ...PercentNumber
    }
    totalSupplied {
      ...ExchangeAmount
    }
    utilizationRate {
      ...PercentNumber
    }
  }`,
  [ExchangeAmountFragment, PercentNumberFragment],
);

export type SpokeConnectedHubSummary = FragmentOf<
  typeof SpokeConnectedHubSummaryFragment
>;

export const SpokeConnectedHubFragment = graphql(
  `fragment SpokeConnectedHub on SpokeConnectedHub {
    __typename
    hub {
      ...Hub
    }
    summary {
      ...SpokeConnectedHubSummary
    }
  }`,
  [HubFragment, SpokeConnectedHubSummaryFragment],
);

export type SpokeConnectedHub = FragmentOf<typeof SpokeConnectedHubFragment>;

export const SpokeFragment = graphql(
  `fragment Spoke on Spoke {
    __typename
    id
    name
    address
    chain {
      ...Chain
    }
    liquidationConfig {
      ...SpokeLiquidationConfig
    }
    summary(currency: $currency) {
      ...SpokeSummary
    }
    connectedHubs(currency: $currency) {
      ...SpokeConnectedHub
    }
  }`,
  [
    ChainFragment,
    SpokeLiquidationConfigFragment,
    SpokeSummaryFragment,
    SpokeConnectedHubFragment,
  ],
);

export type Spoke = FragmentOf<typeof SpokeFragment>;

export const SpokePositionManagerFragment = graphql(
  `fragment SpokePositionManager on SpokePositionManager {
    __typename
    address
    active
    name
  }`,
);

export type SpokePositionManager = FragmentOf<
  typeof SpokePositionManagerFragment
>;

export const PaginatedSpokePositionManagerResultFragment = graphql(
  `fragment PaginatedSpokePositionManagerResult on PaginatedSpokePositionManagerResult {
    __typename
    items {
      ...SpokePositionManager
      }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [SpokePositionManagerFragment, PaginatedResultInfoFragment],
);

export type PaginatedSpokePositionManagerResult = FragmentOf<
  typeof PaginatedSpokePositionManagerResultFragment
>;

export const SpokeUserPositionManagerFragment = graphql(
  `fragment SpokeUserPositionManager on SpokeUserPositionManager {
    __typename
    address
    approvedOn
    active
    name
  }`,
);

export type SpokeUserPositionManager = FragmentOf<
  typeof SpokeUserPositionManagerFragment
>;

export const PaginatedSpokeUserPositionManagerResultFragment = graphql(
  `fragment PaginatedSpokeUserPositionManagerResult on PaginatedSpokeUserPositionManagerResult {
    __typename
    items {
      ...SpokeUserPositionManager
    }
    pageInfo {
      ...PaginatedResultInfo
    }
  }`,
  [SpokeUserPositionManagerFragment, PaginatedResultInfoFragment],
);

export type PaginatedSpokeUserPositionManagerResult = FragmentOf<
  typeof PaginatedSpokeUserPositionManagerResultFragment
>;
