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
  `query Spoke($request: SpokeRequest!) {
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
  `query Spokes($request: SpokesRequest!) {
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
