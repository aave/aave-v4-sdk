import type { FragmentOf } from 'gql.tada';
import {
  ExchangeAmountFragment,
  HubAssetFragment,
  PercentNumberFragment,
} from './fragments';
import { HubFragment } from './fragments/hubs';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const HubQuery = graphql(
  `query Hub($request: HubRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
      value: hub(request: $request) {
        ...Hub
      }
    }`,
  [HubFragment],
);
export type HubRequest = RequestOf<typeof HubQuery>;

export type HubRequestQuery = ReturnType<
  typeof graphql.scalar<'HubRequestQuery'>
>;

/**
 * @internal
 */
export const HubsQuery = graphql(
  `query Hubs($request: HubsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
      value: hubs(request: $request) {
        ...Hub
      }
    }`,
  [HubFragment],
);
export type HubsRequest = RequestOf<typeof HubsQuery>;

/**
 * @internal
 */
export const HubAssetsQuery = graphql(
  `query HubAssets($request: HubAssetsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
      value: hubAssets(request: $request) {
        ...HubAsset
      }
    }`,
  [HubAssetFragment],
);
export type HubAssetsRequest = RequestOf<typeof HubAssetsQuery>;

export type HubAssetsRequestQuery = ReturnType<
  typeof graphql.scalar<'HubAssetsRequestQuery'>
>;

export type HubsRequestQuery = ReturnType<
  typeof graphql.scalar<'HubsRequestQuery'>
>;

export const HubSummarySampleFragment = graphql(
  `fragment HubSummarySample on HubSummarySample {
      __typename
      date
      deposits {
        ...ExchangeAmount
      }
      borrows {
        ...ExchangeAmount
      }
      availableLiquidity {
        ...ExchangeAmount
      }
      utilizationRate {
        ...PercentNumber
      }
    }`,
  [ExchangeAmountFragment, PercentNumberFragment],
);
export type HubSummarySample = FragmentOf<typeof HubSummarySampleFragment>;

/**
 * @internal
 */
export const HubSummaryHistoryQuery = graphql(
  `query HubSummaryHistory($request: HubSummaryHistoryRequest!) {
      value: hubSummaryHistory(request: $request) {
        ...HubSummarySample
      }
    }`,
  [HubSummarySampleFragment],
);
export type HubSummaryHistoryRequest = RequestOf<typeof HubSummaryHistoryQuery>;

export type HubSummaryHistoryRequestQuery = ReturnType<
  typeof graphql.scalar<'HubSummaryHistoryRequestQuery'>
>;
export type HubAssetsRequestOrderBy = ReturnType<
  typeof graphql.scalar<'HubAssetsRequestOrderBy'>
>;
export type HubsRequestOrderBy = ReturnType<
  typeof graphql.scalar<'HubsRequestOrderBy'>
>;
