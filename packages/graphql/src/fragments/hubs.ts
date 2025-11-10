import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ChainFragment, FiatAmountFragment } from './common';

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
    utilizationRate
  }`,
  [FiatAmountFragment],
);
export type HubSummary = FragmentOf<typeof HubSummaryFragment>;

export const HubFragment = graphql(
  `fragment Hub on Hub {
      __typename
      id
      name
      address
      chain {
        ...Chain
      }
      summary(currency: $currency) {
        ...HubSummary
      }
    }`,
  [ChainFragment, HubSummaryFragment],
);
export type Hub = FragmentOf<typeof HubFragment>;
