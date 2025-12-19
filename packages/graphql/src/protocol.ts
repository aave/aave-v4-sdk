import type { FragmentOf } from 'gql.tada';
import {
  DecimalNumberFragment,
  DecimalNumberWithChangeFragment,
  Erc20TokenFragment,
  ExchangeAmountFragment,
  ExchangeAmountWithChangeFragment,
  PercentNumberFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

export const AssetPriceSampleFragment = graphql(
  `fragment AssetPriceSample on AssetPriceSample {
      __typename
      date
      price
    }`,
);
export type AssetPriceSample = FragmentOf<typeof AssetPriceSampleFragment>;

export const AssetSupplySampleFragment = graphql(
  `fragment AssetSupplySample on AssetSupplySample {
      __typename
      date
      amount {
        ...DecimalNumber
      }
      highestApy {
        ...PercentNumber
      }
      lowestApy {
        ...PercentNumber
      }
    }`,
  [DecimalNumberFragment, PercentNumberFragment],
);
export type AssetSupplySample = FragmentOf<typeof AssetSupplySampleFragment>;

export const AssetBorrowSampleFragment = graphql(
  `fragment AssetBorrowSample on AssetBorrowSample {
      __typename
      date
      amount {
        ...DecimalNumber
      }
      highestApy {
        ...PercentNumber
      }
      lowestApy {
        ...PercentNumber
      }
    }`,
  [DecimalNumberFragment, PercentNumberFragment],
);
export type AssetBorrowSample = FragmentOf<typeof AssetBorrowSampleFragment>;

export const AssetAmountWithChangeFragment = graphql(
  `fragment AssetAmountWithChange on AssetAmountWithChange {
    __typename
    amount {
      ...DecimalNumberWithChange
    }
    exchange(currency: $currency) {
      ...ExchangeAmountWithChange
    }
  }`,
  [DecimalNumberWithChangeFragment, ExchangeAmountWithChangeFragment],
);
export type AssetAmountWithChange = FragmentOf<
  typeof AssetAmountWithChangeFragment
>;

export const AssetSummaryFragment = graphql(
  `fragment AssetSummary on AssetSummary {
      __typename
      totalSupplyCap {
        ...DecimalNumberWithChange
      }
      totalSupplied {
        ...AssetAmountWithChange
      }
      totalSuppliable {
        ...AssetAmountWithChange
      }
      totalBorrowCap {
        ...DecimalNumberWithChange
      }
      totalBorrowed {
        ...AssetAmountWithChange
      }
      totalBorrowable {
        ...AssetAmountWithChange
      }
      averageBorrowApy: borrowApy(metric: AVERAGE) {
        ...PercentNumber
      }
      averageSupplyApy: supplyApy(metric: AVERAGE) {
        ...PercentNumber
      }
    }`,
  [
    AssetAmountWithChangeFragment,
    DecimalNumberWithChangeFragment,
    PercentNumberFragment,
  ],
);
export type AssetSummary = FragmentOf<typeof AssetSummaryFragment>;

export const AssetFragment = graphql(
  `fragment Asset on Asset {
      __typename
      id
      token {
        ...Erc20Token
      }
      summary {
        ...AssetSummary
      }
      price(currency: $currency) {
        ...ExchangeAmountWithChange
      }
    }`,
  [Erc20TokenFragment, AssetSummaryFragment, ExchangeAmountWithChangeFragment],
);
export type Asset = FragmentOf<typeof AssetFragment>;

/**
 * @internal
 */
export const AssetQuery = graphql(
  `query Asset($request: AssetRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
      value: asset(request: $request) {
        ...Asset
      }
    }`,
  [AssetFragment],
);
export type AssetRequest = RequestOf<typeof AssetQuery>;

export type AssetRequestQuery = ReturnType<
  typeof graphql.scalar<'AssetRequestQuery'>
>;

/**
 * @internal
 */
export const AssetPriceHistoryQuery = graphql(
  `query AssetPriceHistory($request: AssetPriceHistoryRequest!) {
      value: assetPriceHistory(request: $request) {
        ...AssetPriceSample
      }
    }`,
  [AssetPriceSampleFragment],
);
export type AssetPriceHistoryRequest = RequestOf<typeof AssetPriceHistoryQuery>;
export type AssetPriceHistoryRequestQuery = ReturnType<
  typeof graphql.scalar<'AssetPriceHistoryRequestQuery'>
>;

/**
 * @internal
 */
export const AssetSupplyHistoryQuery = graphql(
  `query AssetSupplyHistory($request: AssetSupplyHistoryRequest!) {
      value: assetSupplyHistory(request: $request) {
        ...AssetSupplySample
      }
    }`,
  [AssetSupplySampleFragment],
);
export type AssetSupplyHistoryRequest = RequestOf<
  typeof AssetSupplyHistoryQuery
>;
export type AssetSupplyHistoryRequestQuery = ReturnType<
  typeof graphql.scalar<'AssetSupplyHistoryRequestQuery'>
>;

/**
 * @internal
 */
export const AssetBorrowHistoryQuery = graphql(
  `query AssetBorrowHistory($request: AssetBorrowHistoryRequest!) {
      value: assetBorrowHistory(request: $request) {
        ...AssetBorrowSample
      }
    }`,
  [AssetBorrowSampleFragment],
);
export type AssetBorrowHistoryRequest = RequestOf<
  typeof AssetBorrowHistoryQuery
>;
export type AssetBorrowHistoryRequestQuery = ReturnType<
  typeof graphql.scalar<'AssetBorrowHistoryRequestQuery'>
>;

export const ProtocolHistorySampleFragment = graphql(
  `fragment ProtocolHistorySample on ProtocolHistorySample {
    __typename
    date
    deposits {
      ...ExchangeAmount
    }
    borrows {
      ...ExchangeAmount
    }
    earnings {
      ...ExchangeAmount
    }
  }`,
  [ExchangeAmountFragment],
);
export type ProtocolHistorySample = FragmentOf<
  typeof ProtocolHistorySampleFragment
>;

/**
 * @internal
 */
export const ProtocolHistoryQuery = graphql(
  `query ProtocolHistory($request: ProtocolHistoryRequest!) {
    value: protocolHistory(request: $request) {
      ...ProtocolHistorySample
    }
  }`,
  [ProtocolHistorySampleFragment],
);
export type ProtocolHistoryRequest = RequestOf<typeof ProtocolHistoryQuery>;
