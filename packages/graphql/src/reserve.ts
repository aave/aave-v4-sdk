import { APYSampleFragment, ReserveFragment } from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const BorrowApyHistoryQuery = graphql(
  `query BorrowApyHistory($request: BorrowAPYHistoryRequest!) {
    value: borrowApyHistory(request: $request) {
      ...APYSample
    }
  }`,
  [APYSampleFragment],
);
export type BorrowAPYHistoryRequest = RequestOf<typeof BorrowApyHistoryQuery>;

/**
 * @internal
 */
export const SupplyApyHistoryQuery = graphql(
  `query SupplyApyHistory($request: SupplyAPYHistoryRequest!) {
    value: supplyApyHistory(request: $request) {
      ...APYSample
    }
  }`,
  [APYSampleFragment],
);
export type SupplyAPYHistoryRequest = RequestOf<typeof SupplyApyHistoryQuery>;

export const BestBorrowReserveQuery = graphql(
  `query BestBorrowReserve($request: BestBorrowReserveRequest!, $currency: Currency!) {
    value: bestBorrowReserve(request: $request) {
      ...Reserve
    }
  }`,
  [ReserveFragment],
);
export type BestBorrowReserveRequest = RequestOf<typeof BestBorrowReserveQuery>;

export const BestSupplyReserveQuery = graphql(
  `query BestSupplyReserve($request: BestSupplyReserveRequest!, $currency: Currency!) {
    value: bestSupplyReserve(request: $request) {
      ...Reserve
    }
  }`,
  [ReserveFragment],
);
export type BestSupplyReserveRequest = RequestOf<typeof BestSupplyReserveQuery>;

export const ReservesQuery = graphql(
  `query Reserves($request: ReservesRequest!, $currency: Currency!) {
    value: reserves(request: $request) {
      ...Reserve
    }
  }`,
  [ReserveFragment],
);
export type ReservesRequest = RequestOf<typeof ReservesQuery>;
