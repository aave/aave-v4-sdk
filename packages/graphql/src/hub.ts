import { HubAssetFragment } from './fragments';
import { HubFragment } from './fragments/hubs';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const HubQuery = graphql(
  `query Hub($request: HubRequest!, $currency: Currency!) {
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
  `query Hubs($request: HubsRequest!, $currency: Currency!) {
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
  `query HubAssets($request: HubAssetsRequest!, $currency: Currency!) {
      value: hubAssets(request: $request) {
        ...HubAsset
      }
    }`,
  [HubAssetFragment],
);
export type HubAssetsRequest = RequestOf<typeof HubAssetsQuery>;
