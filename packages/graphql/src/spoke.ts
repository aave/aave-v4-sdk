import { SpokeFragment } from './fragments/spoke';
import { graphql, type RequestOf } from './graphql';

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
