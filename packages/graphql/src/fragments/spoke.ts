import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ChainFragment, PaginatedResultInfoFragment } from './common';

export const SpokeFragment = graphql(
  `fragment Spoke on Spoke {
    __typename
    name
    address
    chain {
      ...Chain
    }
  }`,
  [ChainFragment],
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

export const SpokeUserPositionManagerFragment = graphql(
  `fragment SpokeUserPositionManager on SpokeUserPositionManger {
    __typename
    address
    enabledAt
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
