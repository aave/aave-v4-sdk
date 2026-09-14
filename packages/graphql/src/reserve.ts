import type { FragmentOf } from 'gql.tada';
import {
  ApySampleFragment,
  PaginatedResultInfoFragment,
  PercentNumberFragment,
  ReserveFragment,
  ReserveHolderFragment,
} from './fragments';
import { graphql, type RequestOf, type ResultOf } from './graphql';

/**
 * @internal
 */
export const BorrowApyHistoryQuery = graphql(
  `query BorrowApyHistory($request: BorrowApyHistoryRequest!) {
    value: borrowApyHistory(request: $request) {
      ...ApySample
    }
  }`,
  [ApySampleFragment],
);
export type BorrowApyHistoryRequest = RequestOf<typeof BorrowApyHistoryQuery>;

/**
 * @internal
 */
export const SupplyApyHistoryQuery = graphql(
  `query SupplyApyHistory($request: SupplyApyHistoryRequest!) {
    value: supplyApyHistory(request: $request) {
      ...ApySample
    }
  }`,
  [ApySampleFragment],
);
export type SupplyApyHistoryRequest = RequestOf<typeof SupplyApyHistoryQuery>;

export const ReserveTrailingSupplyApysFragment = graphql(
  `fragment ReserveTrailingSupplyApys on Reserve {
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
export type ReserveTrailingSupplyApys = FragmentOf<
  typeof ReserveTrailingSupplyApysFragment
>;

/**
 * @internal
 */
export const ReserveTrailingSupplyApysQuery = graphql(
  `query ReserveTrailingSupplyApys($request: ReserveRequest!) {
    value: reserve(request: $request) {
      ...ReserveTrailingSupplyApys
    }
  }`,
  [ReserveTrailingSupplyApysFragment],
);
export type ReserveTrailingSupplyApysRequest = RequestOf<
  typeof ReserveTrailingSupplyApysQuery
>;

export const ReserveQuery = graphql(
  `query Reserve($request: ReserveRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: reserve(request: $request) {
      ...Reserve
    }
  }`,
  [ReserveFragment],
);
export type ReserveRequest = RequestOf<typeof ReserveQuery>;

export type ReserveRequestQuery = ReturnType<
  typeof graphql.scalar<'ReserveRequestQuery'>
>;

export const ReservesQuery = graphql(
  `query Reserves($request: ReservesRequest!, $currency: Currency!, $timeWindow: TimeWindow!) {
    value: reserves(request: $request) {
      ...Reserve
    }
  }`,
  [ReserveFragment],
);
export type ReservesRequest = RequestOf<typeof ReservesQuery>;

export type ReservesRequestOrderBy = ReturnType<
  typeof graphql.scalar<'ReservesRequestOrderBy'>
>;
export type ReservesRequestQuery = ReturnType<
  typeof graphql.scalar<'ReservesRequestQuery'>
>;
export type ChainTokenCategories = ReturnType<
  typeof graphql.scalar<'ChainTokenCategories'>
>;

/**
 * @internal
 */
export const ReserveHoldersQuery = graphql(
  `query ReserveHolders($request: PaginatedReserveHoldersRequest!, $currency: Currency!) {
    value: reserveHolders(request: $request) {
      items {
        ...ReserveHolder
      }
      pageInfo {
        ...PaginatedResultInfo
      }
    }
  }`,
  [ReserveHolderFragment, PaginatedResultInfoFragment],
);
export type ReserveHoldersRequest = RequestOf<typeof ReserveHoldersQuery>;

export type ReserveHoldersOrderBy = ReturnType<
  typeof graphql.scalar<'ReserveHoldersOrderBy'>
>;

export type PaginatedReserveHoldersResult = ResultOf<
  typeof ReserveHoldersQuery
>['value'];

/**
 * @internal
 */
export const HubAssetHoldersQuery = graphql(
  `query HubAssetHolders($request: HubAssetHoldersRequest!, $currency: Currency!) {
    value: hubAssetHolders(request: $request) {
      items {
        ...ReserveHolder
      }
      pageInfo {
        ...PaginatedResultInfo
      }
    }
  }`,
  [ReserveHolderFragment, PaginatedResultInfoFragment],
);
export type HubAssetHoldersRequest = RequestOf<typeof HubAssetHoldersQuery>;

export type HubAssetHoldersRequestQuery = ReturnType<
  typeof graphql.scalar<'HubAssetHoldersRequestQuery'>
>;
