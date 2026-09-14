import type { FragmentOf } from 'gql.tada';
import {
  Erc20AmountFragment,
  Erc20TokenFragment,
  ExchangeAmountFragment,
  HubAssetFragment,
  HubAssetUserSuppliesFragment,
  HubExposureItemFragment,
  PercentNumberFragment,
} from './fragments';
import { HubFragment } from './fragments/hubs';
import { SpokeFragment } from './fragments/spoke';
import { graphql, type RequestOf, type ResultOf } from './graphql';

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
export const HubExposureQuery = graphql(
  `query HubExposure($request: HubRequest!, $currency: Currency!) {
      value: hub(request: $request) {
        __typename
        id
        exposure {
          ...HubExposureItem
          asset {
            __typename
            id
            underlying {
              ...Erc20Token
            }
          }
        }
      }
    }`,
  [HubExposureItemFragment, Erc20TokenFragment],
);
export type HubExposureRequest = RequestOf<typeof HubExposureQuery>;

export type HubExposure = ResultOf<typeof HubExposureQuery>['value'];

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

/**
 * @internal
 */
export const HubAssetsWithUserSuppliesQuery = graphql(
  `query HubAssetsWithUserSupplies($request: HubAssetsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
      value: hubAssets(request: $request) {
        ...HubAsset
        userState {
          ...HubAssetUserSupplies
        }
      }
    }`,
  [HubAssetFragment, HubAssetUserSuppliesFragment],
);
export type HubAssetsWithUserSuppliesRequest = RequestOf<
  typeof HubAssetsWithUserSuppliesQuery
>;

export type HubAssetWithUserSupplies = ResultOf<
  typeof HubAssetsWithUserSuppliesQuery
>['value'][number];

export const HubAssetTrailingSupplyApysFragment = graphql(
  `fragment HubAssetTrailingSupplyApys on HubAsset {
      __typename
      id
      summary {
        __typename
        last7Days: trailingSupplyApy(window: LAST_WEEK) {
          ...PercentNumber
        }
        last30Days: trailingSupplyApy(window: LAST_MONTH) {
          ...PercentNumber
        }
        last90Days: trailingSupplyApy(window: LAST_NINETY_DAYS) {
          ...PercentNumber
        }
      }
    }`,
  [PercentNumberFragment],
);
export type HubAssetTrailingSupplyApys = FragmentOf<
  typeof HubAssetTrailingSupplyApysFragment
>;

/**
 * @internal
 */
export const HubAssetTrailingSupplyApysQuery = graphql(
  `query HubAssetTrailingSupplyApys($request: HubAssetsRequest!) {
      value: hubAssets(request: $request) {
        ...HubAssetTrailingSupplyApys
      }
    }`,
  [HubAssetTrailingSupplyApysFragment],
);
export type HubAssetTrailingSupplyApysRequest = RequestOf<
  typeof HubAssetTrailingSupplyApysQuery
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

export type HubAssetInterestRateModelRequestQuery = ReturnType<
  typeof graphql.scalar<'HubAssetInterestRateModelRequestQuery'>
>;

export const HubAssetInterestRateModelPointFragment = graphql(
  `fragment HubAssetInterestRateModelPoint on HubAssetInterestRateModelPoint {
      __typename
      utilizationRate {
        ...PercentNumber
      }
      borrowRate {
        ...PercentNumber
      }
      supplyRate {
        ...PercentNumber
      }
      liquidityDistance {
        ...Erc20Amount
      }
    }`,
  [PercentNumberFragment, Erc20AmountFragment],
);
export type HubAssetInterestRateModelPoint = FragmentOf<
  typeof HubAssetInterestRateModelPointFragment
>;

/**
 * @internal
 */
export const HubAssetInterestRateModelQuery = graphql(
  `query HubAssetInterestRateModel($request: HubAssetInterestRateModelRequest!, $currency: Currency!) {
      value: hubAssetInterestRateModel(request: $request) {
        points {
          ...HubAssetInterestRateModelPoint
        }
      }
    }`,
  [HubAssetInterestRateModelPointFragment],
);
export type HubAssetInterestRateModelRequest = RequestOf<
  typeof HubAssetInterestRateModelQuery
>;

export const HubSpokeConfigFragment = graphql(
  `fragment HubSpokeConfig on HubSpokeConfig {
      __typename
      hub {
        ...Hub
      }
      spoke {
        ...Spoke
      }
      asset {
        ...HubAsset
      }
      supplyCap {
        ...Erc20Amount
      }
      borrowCap {
        ...Erc20Amount
      }
      active
      halted
      riskPremiumThreshold {
        ...PercentNumber
      }
    }`,
  [
    HubFragment,
    SpokeFragment,
    HubAssetFragment,
    Erc20AmountFragment,
    PercentNumberFragment,
  ],
);
export type HubSpokeConfig = FragmentOf<typeof HubSpokeConfigFragment>;

/**
 * @internal
 */
export const HubSpokeConfigsQuery = graphql(
  `query HubSpokeConfigs($request: HubSpokeConfigsRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
      value: hubSpokeConfigs(request: $request) {
        ...HubSpokeConfig
      }
    }`,
  [HubSpokeConfigFragment],
);
export type HubSpokeConfigsRequest = RequestOf<typeof HubSpokeConfigsQuery>;
