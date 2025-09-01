import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { TokenInfoFragment } from './common';

export const ChainFragment = graphql(
  `fragment Chain on Chain {
    __typename
    name
    icon
    chainId
    explorerUrl
    isTestnet
    nativeWrappedToken
    nativeInfo {
      ...TokenInfo
    }
  }`,
  [TokenInfoFragment],
);
export type Chain = FragmentOf<typeof ChainFragment>;
