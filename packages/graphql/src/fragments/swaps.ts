import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';
import { DomainDataFragment } from '../permits';
import { PercentValueFragment, TokenAmountFragment } from './common';
import { TransactionRequestFragment } from './transactions';

export const SwapQuoteCostsFragment = graphql(
  `fragment SwapQuoteCosts on SwapQuoteCosts {
    __typename
    networkCosts {
      ...TokenAmount
    }
    partnerFeeAmount {
      ...TokenAmount
    }
  }`,
  [TokenAmountFragment],
);
export type SwapQuoteCosts = FragmentOf<typeof SwapQuoteCostsFragment>;

export const SwapQuoteFragment = graphql(
  `fragment SwapQuote on SwapQuote {
    __typename
    suggestedSlippage {
      ...PercentValue
    }
    sellAmount {
      ...TokenAmount
    }
    buyAmount {
      ...TokenAmount
    }
    costs {
      ...SwapQuoteCosts
    }
    minimumReceived {
      ...TokenAmount
    }
  }`,
  [PercentValueFragment, TokenAmountFragment, SwapQuoteCostsFragment],
);
export type SwapQuote = FragmentOf<typeof SwapQuoteFragment>;

export const SwapByIntentTypeDefinitionFragment = graphql(
  `fragment SwapByIntentTypeDefinition on SwapByIntentTypeDefinition {
    __typename
    eip712Domain {
      name
      type
    }
  }`,
);
export type SwapByIntentTypeDefinition = FragmentOf<
  typeof SwapByIntentTypeDefinitionFragment
>;

export const SwapByIntentTypedDataFragment = graphql(
  `fragment SwapByIntentTypedData on SwapByIntentTypedData {
    __typename
    types {
      ...SwapByIntentTypeDefinition
    }
    primaryType
    domain {
      ...DomainData
    }
  }`,
  [SwapByIntentTypeDefinitionFragment, DomainDataFragment],
);
export type SwapByIntentTypedData = FragmentOf<
  typeof SwapByIntentTypedDataFragment
>;

export const SwapByIntentFragment = graphql(
  `fragment SwapByIntent on SwapByIntent {
    __typename
    id
    quote {
      ...SwapQuote
    }
    data {
      ...SwapByIntentTypedData
    }
  }`,
  [SwapQuoteFragment, SwapByIntentTypedDataFragment],
);
export type SwapByIntent = FragmentOf<typeof SwapByIntentFragment>;

export const SwapByIntentWithApprovalRequiredFragment = graphql(
  `fragment SwapByIntentWithApprovalRequired on SwapByIntentWithApprovalRequired {
    __typename
    id
    approval {
      ...TransactionRequest
    }
    quote {
      ...SwapQuote
    }
    data {
      ...SwapByIntentTypedData
    }
  }`,
  [
    TransactionRequestFragment,
    SwapQuoteFragment,
    SwapByIntentTypedDataFragment,
  ],
);
export type SwapByIntentWithApprovalRequired = FragmentOf<
  typeof SwapByIntentWithApprovalRequiredFragment
>;

export const SwapByTransactionFragment = graphql(
  `fragment SwapByTransaction on SwapByTransaction {
    __typename
    id
    quote {
      ...SwapQuote
    }
  }`,
  [SwapQuoteFragment],
);
export type SwapByTransaction = FragmentOf<typeof SwapByTransactionFragment>;

export const SwapReceiptFragment = graphql(
  `fragment SwapReceipt on SwapReceipt {
    __typename
    id
    explorerLink
  }`,
);
export type SwapReceipt = FragmentOf<typeof SwapReceiptFragment>;

export type PrepareSwapResult =
  | SwapByIntent
  | SwapByIntentWithApprovalRequired
  | SwapByTransaction;

export const PrepareSwapResultFragment: FragmentDocumentFor<
  PrepareSwapResult,
  'PrepareSwapResult'
> = graphql(
  `fragment PrepareSwapResult on PrepareSwapResult {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
    ... on SwapByIntentWithApprovalRequired {
      ...SwapByIntentWithApprovalRequired
    }
    ... on SwapByTransaction {
      ...SwapByTransaction
    }
  }`,
  [
    SwapByIntentFragment,
    SwapByIntentWithApprovalRequiredFragment,
    SwapByTransactionFragment,
  ],
);
