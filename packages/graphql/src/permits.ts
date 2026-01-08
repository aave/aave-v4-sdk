import { DomainDataFragment } from './fragments';
import { type FragmentOf, graphql, type RequestOf } from './graphql';

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

export const PermitTypedDataResponseFragment = graphql(
  `fragment PermitTypedDataResponse on PermitTypedDataResponse {
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
export type PermitTypedDataResponse = FragmentOf<
  typeof PermitTypedDataResponseFragment
>;

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

/**
 * @internal
 */
export const PermitTypedDataQuery = graphql(
  `query PermitTypedData($request: PermitRequest!) {
    value: permitTypedData(request: $request) {
      ...PermitTypedDataResponse
    }
  }`,
  [PermitTypedDataResponseFragment],
);
export type PermitRequest = RequestOf<typeof PermitTypedDataQuery>;

export type RepayPermitRequest = ReturnType<
  typeof graphql.scalar<'RepayPermitRequest'>
>;

export type SupplyPermitRequest = ReturnType<
  typeof graphql.scalar<'SupplyPermitRequest'>
>;
