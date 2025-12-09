import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ChainFragment, ExchangeAmountFragment } from './common';

export const HubSummaryFragment = graphql(
  `fragment HubSummary on HubSummary {
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
    utilizationRate
  }`,
  [ExchangeAmountFragment],
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
