import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { ExchangeAmountFragment } from './common';

export const ExternalCuratorDetailFragment = graphql(
  `fragment ExternalCuratorDetail on ExternalCuratorDetail {
    __typename
    kind
    value
    tooltip
    href
  }`,
);
export type ExternalCuratorDetail = FragmentOf<
  typeof ExternalCuratorDetailFragment
>;

export const CuratorSummaryFragment = graphql(
  `fragment CuratorSummary on CuratorSummary {
    __typename
    totalSupplied {
      ...ExchangeAmount
    }
    totalBorrowed {
      ...ExchangeAmount
    }
    hubsCount
    spokesCount
    chainIds
  }`,
  [ExchangeAmountFragment],
);
export type CuratorSummary = FragmentOf<typeof CuratorSummaryFragment>;

export const ExternalCuratorFragment = graphql(
  `fragment ExternalCurator on ExternalCurator {
    __typename
    id
    name
    description
    icon
    details {
      ...ExternalCuratorDetail
    }
    createdAt
    updatedAt
    summary(currency: $currency) {
      ...CuratorSummary
    }
  }`,
  [ExternalCuratorDetailFragment, CuratorSummaryFragment],
);
export type ExternalCurator = FragmentOf<typeof ExternalCuratorFragment>;
