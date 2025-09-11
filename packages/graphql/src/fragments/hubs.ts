import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import {
  ChainFragment,
  Erc20TokenFragment,
  FiatAmountFragment,
} from './common';

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
  }`,
  [FiatAmountFragment],
);
export type HubSummary = FragmentOf<typeof HubSummaryFragment>;

export const HubFragment = graphql(
  `fragment Hub on Hub {
      __typename
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

export const HubAssetInfoFragment = graphql(
  `fragment HubAssetInfo on HubAsset {
      __typename
      assetId
      hub {
        ...Hub
      }
      underlying {
        ...Erc20Token
      }
    }`,
  [HubFragment, Erc20TokenFragment],
);
export type HubAssetInfo = FragmentOf<typeof HubAssetInfoFragment>;
