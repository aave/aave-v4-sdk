import type { FragmentOf } from 'gql.tada';
import {
  DecimalNumberWithChangeFragment,
  Erc20TokenFragment,
  FiatAmountWithChangeFragment,
} from './fragments';
import { graphql, type RequestOf } from './graphql';

export const AssetSummaryFragment = graphql(
  `fragment AssetSummary on AssetSummary {
      __typename
      totalSupplyCap {
        ...DecimalNumberWithChange
      }
      totalSupplied {
        ...DecimalNumberWithChange
      }
      totalSuppliable {
        ...DecimalNumberWithChange
      }
      totalBorrowCap {
        ...DecimalNumberWithChange
      }
      totalBorrowed {
        ...DecimalNumberWithChange
      }
      totalBorrowable {
        ...DecimalNumberWithChange
      }
    }`,
  [DecimalNumberWithChangeFragment],
);
export type AssetSummary = FragmentOf<typeof AssetSummaryFragment>;

export const AssetFragment = graphql(
  `fragment Asset on Asset {
      __typename
      token {
        ...Erc20Token
      }
      summary {
        ...AssetSummary
      }
      price(currency: $currency) {
        ...FiatAmountWithChange
      }
    }`,
  [Erc20TokenFragment, AssetSummaryFragment, FiatAmountWithChangeFragment],
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
