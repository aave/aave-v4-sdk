import type { FragmentOf } from 'gql.tada';
import { graphql } from "../graphql";
import { ChainFragment } from './chain';

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
