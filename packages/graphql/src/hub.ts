import { HubAssetFragment } from './fragments';
import { graphql, type RequestOf } from './graphql';

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
