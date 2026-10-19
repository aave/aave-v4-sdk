import { ExternalCuratorFragment } from './fragments';
import { graphql, type RequestOf } from './graphql';

/**
 * @internal
 */
export const ExternalCuratorQuery = graphql(
  `query ExternalCurator($request: ExternalCuratorRequest!, $currency: Currency!) {
    value: externalCurator(request: $request) {
      ...ExternalCurator
    }
  }`,
  [ExternalCuratorFragment],
);
export type ExternalCuratorRequest = RequestOf<typeof ExternalCuratorQuery>;

/**
 * @internal
 */
export const ExternalCuratorsQuery = graphql(
  `query ExternalCurators($request: ExternalCuratorsRequest!, $currency: Currency!) {
    value: externalCurators(request: $request) {
      ...ExternalCurator
    }
  }`,
  [ExternalCuratorFragment],
);
export type ExternalCuratorsRequest = RequestOf<typeof ExternalCuratorsQuery>;

export type ExternalCuratorsRequestQuery = ReturnType<
  typeof graphql.scalar<'ExternalCuratorsRequestQuery'>
>;
