import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  ChainFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
} from './common';

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
  }`,
  [ChainFragment, SpokeLiquidationConfigFragment],
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
