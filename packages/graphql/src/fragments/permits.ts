import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { DomainDataFragment } from './common';

export const PermitTypedDataFragment = graphql(
  `fragment PermitTypedData on PermitTypedData {
    __typename
    types
    primaryType
    domain {
      ...DomainData
    }
    message
  }`,
  [DomainDataFragment],
);
export type PermitTypedData = FragmentOf<typeof PermitTypedDataFragment>;

export type ERC20PermitSignature = ReturnType<
  typeof graphql.scalar<'ERC20PermitSignature'>
>;

/**
 * Type guard for an ERC20 permit signature.
 */
export function isERC20PermitSignature(
  signature: unknown,
): signature is ERC20PermitSignature {
  return (
    typeof signature === 'object' &&
    signature !== null &&
    'deadline' in signature &&
    'value' in signature
  );
}
