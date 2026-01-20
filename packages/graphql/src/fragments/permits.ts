import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { DomainDataFragment } from './common';

export const TypeFieldFragment = graphql(
  `fragment TypeField on TypeField {
    name
    type
  }`,
);
export type TypeField = FragmentOf<typeof TypeFieldFragment>;

export const TypeDefinitionFragment = graphql(
  `fragment TypeDefinition on TypeDefinition {
    EIP712Domain {
      ...TypeField
    }
    Permit {
      ...TypeField
    }
  }`,
  [TypeFieldFragment],
);
export type TypeDefinition = FragmentOf<typeof TypeDefinitionFragment>;

export const PermitMessageDataFragment = graphql(
  `fragment PermitMessageData on PermitMessageData {
    owner
    spender
    value
    nonce
    deadline
  }`,
);
export type PermitMessageData = FragmentOf<typeof PermitMessageDataFragment>;

export const PermitTypedDataFragment = graphql(
  `fragment PermitTypedData on PermitTypedData {
    __typename
    types {
      ...TypeDefinition
    }
    primaryType
    domain {
      ...DomainData
    }
    message {
      ...PermitMessageData
    }
  }`,
  [TypeDefinitionFragment, DomainDataFragment, PermitMessageDataFragment],
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
