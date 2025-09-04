import { HubFragment } from './fragments/hubs';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const HubQuery = graphql(
  `query Hub($request: HubRequest!) {
      value: hub(request: $request) {
        ...Hub
      }
    }`,
  [HubFragment],
);
export type HubRequest = RequestOf<typeof HubQuery>;

/**
 * @internal
 */
export const HubsQuery = graphql(
  `query Hubs($request: HubsRequest!) {
      value: hubs(request: $request) {
        ...Hub
      }
    }`,
  [HubFragment],
);
export type HubsRequest = RequestOf<typeof HubsQuery>;
