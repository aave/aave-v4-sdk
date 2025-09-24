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

export const DomainDataFragment = graphql(
  `fragment DomainData on DomainData {
    name
    version
    chainId
    verifyingContract
  }`,
);
export type DomainData = FragmentOf<typeof DomainDataFragment>;

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
export type PermitTypedDataRequest = RequestOf<typeof PermitTypedDataQuery>;
