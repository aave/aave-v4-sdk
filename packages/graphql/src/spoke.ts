import type { FragmentOf } from 'gql.tada';
import { ExchangeAmountFragment } from './fragments/common';
import {
  PaginatedSpokePositionManagerResultFragment,
  PaginatedSpokeUserPositionManagerResultFragment,
  SpokeFragment,
} from './fragments/spoke';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const SpokeQuery = graphql(
  `query Spoke($request: SpokeRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: spoke(request: $request) {
      ...Spoke
    }
  }`,
  [SpokeFragment],
);
export type SpokeRequest = RequestOf<typeof SpokeQuery>;

export type SpokeRequestQuery = ReturnType<
  typeof graphql.scalar<'SpokeRequestQuery'>
>;

/**
 * @internal
 */
export const SpokesQuery = graphql(
  `query Spokes($request: SpokesRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: spokes(request: $request) {
      ...Spoke
    }
  }`,
  [SpokeFragment],
);
export type SpokesRequest = RequestOf<typeof SpokesQuery>;

export type SpokesRequestQuery = ReturnType<
  typeof graphql.scalar<'SpokesRequestQuery'>
>;

/**
 * @internal
 */
export const SpokePositionManagersQuery = graphql(
  `query SpokePositionManagers($request: SpokePositionManagersRequest!) {
    value: spokePositionManagers(request: $request) {
      ...PaginatedSpokePositionManagerResult
    }
  }`,
  [PaginatedSpokePositionManagerResultFragment],
);
export type SpokePositionManagersRequest = RequestOf<
  typeof SpokePositionManagersQuery
>;

/**
 * @internal
 */
export const SpokeUserPositionManagersQuery = graphql(
  `query SpokeUserPositionManagers($request: SpokeUserPositionManagersRequest!) {
    value: spokeUserPositionManagers(request: $request) {
      ...PaginatedSpokeUserPositionManagerResult
    }
  }`,
  [PaginatedSpokeUserPositionManagerResultFragment],
);
export type SpokeUserPositionManagersRequest = RequestOf<
  typeof SpokeUserPositionManagersQuery
>;

export const SpokeSummarySampleFragment = graphql(
  `fragment SpokeSummarySample on SpokeSummarySample {
    __typename
    date
    deposits {
      ...ExchangeAmount
    }
    borrows {
      ...ExchangeAmount
    }
  }`,
  [ExchangeAmountFragment],
);
export type SpokeSummarySample = FragmentOf<typeof SpokeSummarySampleFragment>;

/**
 * @internal
 */
export const SpokeSummaryHistoryQuery = graphql(
  `query SpokeSummaryHistory($request: SpokeSummaryHistoryRequest!) {
    value: spokeSummaryHistory(request: $request) {
      ...SpokeSummarySample
    }
  }`,
  [SpokeSummarySampleFragment],
);
export type SpokeSummaryHistoryRequest = RequestOf<
  typeof SpokeSummaryHistoryQuery
>;

export type SpokeSummaryHistoryRequestQuery = ReturnType<
  typeof graphql.scalar<'SpokeSummaryHistoryRequestQuery'>
>;
