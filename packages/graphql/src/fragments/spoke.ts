import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ChainFragment } from './chain';
import { PaginatedResultInfoFragment } from './common';

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

export const SpokePositionManagerFragment = graphql(
  `fragment SpokePositionManager on SpokePositionManger {
    __typename
    address
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
