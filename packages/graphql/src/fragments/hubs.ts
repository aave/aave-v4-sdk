import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  ChainFragment,
  ExchangeAmountFragment,
  ExchangeAmountWithChangeFragment,
  PercentNumberFragment,
} from './common';

export const HubSummaryFragment = graphql(
  `fragment HubSummary on HubSummary {
    __typename
    totalBorrowed {
      ...ExchangeAmountWithChange
    }
    totalBorrowCap {
      ...ExchangeAmount
    }
    totalSupplied {
      ...ExchangeAmountWithChange
    }
    totalSupplyCap {
      ...ExchangeAmount
    }
    utilizationRate {
      ...PercentNumber
    }
  }`,
  [
    ExchangeAmountFragment,
    ExchangeAmountWithChangeFragment,
    PercentNumberFragment,
  ],
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
