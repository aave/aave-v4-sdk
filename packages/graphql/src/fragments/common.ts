import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';

export const DecimalNumberFragment =
  graphql(`fragment DecimalNumber on DecimalNumber {
    __typename
    onChainValue
    decimals
    value
  }`);
export type DecimalNumber = FragmentOf<typeof DecimalNumberFragment>;

export const PercentNumberFragment = graphql(
  `fragment PercentNumber on PercentNumber {
    __typename
    onChainValue
    decimals
    value
    normalized
  }`,
);
export type PercentNumber = FragmentOf<typeof PercentNumberFragment>;

export const DecimalNumberWithChangeFragment = graphql(
  `fragment DecimalNumberWithChange on DecimalNumberWithChange {
    __typename
    current {
      ...DecimalNumber
    }
    change(window: $timeWindow) {
      ...PercentNumber
    }
  }`,
  [DecimalNumberFragment, PercentNumberFragment],
);
export type DecimalNumberWithChange = FragmentOf<
  typeof DecimalNumberWithChangeFragment
>;

export const ExchangeAmountFragment = graphql(
  `fragment ExchangeAmount on ExchangeAmount {
    __typename
    value
    name
    symbol
    icon
    decimals
  }`,
);
export type ExchangeAmount = FragmentOf<typeof ExchangeAmountFragment>;

export const TokenInfoFragment = graphql(
  `fragment TokenInfo on TokenInfo {
    __typename
    name
    symbol
    icon
    decimals
  }`,
);
export type TokenInfo = FragmentOf<typeof TokenInfoFragment>;

export const ChainFragment = graphql(
  `fragment Chain on Chain {
    __typename
    name
    icon
    chainId
    rpcUrl
    explorerUrl
    isTestnet
    nativeWrappedToken
    nativeGateway
    signatureGateway
    nativeInfo {
      ...TokenInfo
    }
  }`,
  [TokenInfoFragment],
);
export type Chain = FragmentOf<typeof ChainFragment>;

export const Erc20TokenFragment = graphql(
  `fragment Erc20Token on Erc20Token {
    __typename
    info {
      ...TokenInfo
    }
    address
    chain {
      ...Chain
    }
    isWrappedNativeToken
    permitSupported
  }`,
  [TokenInfoFragment, ChainFragment],
);
export type Erc20Token = FragmentOf<typeof Erc20TokenFragment>;

export const NativeTokenFragment = graphql(
  `fragment NativeToken on NativeToken {
    __typename
    info {
      ...TokenInfo
    }
    chain {
      ...Chain
    }
  }`,
  [TokenInfoFragment, ChainFragment],
);
export type NativeToken = FragmentOf<typeof NativeTokenFragment>;

export const Erc20AmountFragment = graphql(
  `fragment Erc20Amount on Erc20Amount {
    __typename
    token {
      ...Erc20Token
    }
    amount {
      ...DecimalNumber
    }
    exchange(currency: $currency){
      ...ExchangeAmount
    }
    exchangeRate(currency: $currency){
      ...DecimalNumber
    }
  }`,
  [Erc20TokenFragment, DecimalNumberFragment, ExchangeAmountFragment],
);
export type Erc20Amount = FragmentOf<typeof Erc20AmountFragment>;

export const NativeAmountFragment = graphql(
  `fragment NativeAmount on NativeAmount {
    __typename
    token {
      ...NativeToken
    }
    amount {
      ...DecimalNumber
    }
    exchange(currency: $currency){
      ...ExchangeAmount
    }
    exchangeRate(currency: $currency){
      ...DecimalNumber
    }
  }`,
  [NativeTokenFragment, DecimalNumberFragment, ExchangeAmountFragment],
);
export type NativeAmount = FragmentOf<typeof NativeAmountFragment>;

export type TokenAmount = Erc20Amount | NativeAmount;

export const TokenAmountFragment: FragmentDocumentFor<
  TokenAmount,
  'TokenAmount'
> = graphql(
  `fragment TokenAmount on TokenAmount {
    __typename
    ... on Erc20Amount {
      ...Erc20Amount
    }
    ... on NativeAmount {
      ...NativeAmount
    }
  }`,
  [Erc20AmountFragment, NativeAmountFragment],
);

export type Token = NativeToken | Erc20Token;

export const TokenFragment: FragmentDocumentFor<Token, 'Token'> = graphql(
  `fragment Token on Token {
    __typename
    ... on Erc20Token {
      ...Erc20Token
    }
    ... on NativeToken {
      ...NativeToken
    }
  }`,
  [Erc20TokenFragment, NativeTokenFragment],
);

export const ExchangeAmountWithChangeFragment = graphql(
  `fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
    __typename
    current {
      ...ExchangeAmount
    }
    change(window: $timeWindow){
      ...PercentNumber
    }
  }`,
  [ExchangeAmountFragment, PercentNumberFragment],
);
export type ExchangeAmountWithChange = FragmentOf<
  typeof ExchangeAmountWithChangeFragment
>;

export const PercentNumberWithChangeFragment = graphql(
  `fragment PercentNumberWithChange on PercentNumberWithChange {
    __typename
    current {
      ...PercentNumber
    }
    change(window: $timeWindow){
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type PercentNumberWithChange = FragmentOf<
  typeof PercentNumberWithChangeFragment
>;

export const PaginatedResultInfoFragment = graphql(
  `fragment PaginatedResultInfo on PaginatedResultInfo {
    __typename
    prev
    next
  }`,
);
export type PaginatedResultInfo = FragmentOf<
  typeof PaginatedResultInfoFragment
>;

export const PercentNumberVariationFragment = graphql(
  `fragment PercentNumberVariation on PercentNumberVariation {
    __typename
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type PercentNumberVariation = FragmentOf<
  typeof PercentNumberVariationFragment
>;

export const ExchangeAmountValueVariationFragment = graphql(
  `fragment ExchangeAmountValueVariation on ExchangeAmountValueVariation {
    __typename
    current {
      ...ExchangeAmount
    }
    after {
      ...ExchangeAmount
    }
  }`,
  [ExchangeAmountFragment],
);
export type ExchangeAmountValueVariation = FragmentOf<
  typeof ExchangeAmountValueVariationFragment
>;

export const HealthFactorWithChangeFragment = graphql(
  `fragment HealthFactorWithChange on HealthFactorWithChange {
    __typename
    current
    change(window: $timeWindow) {
      ...PercentNumber
    }
  }`,
  [PercentNumberFragment],
);
export type HealthFactorWithChange = FragmentOf<
  typeof HealthFactorWithChangeFragment
>;

export const HealthFactorVariationFragment = graphql(
  `fragment HealthFactorVariation on HealthFactorVariation {
    __typename
    current
    after
  }`,
);
export type HealthFactorVariation = FragmentOf<
  typeof HealthFactorVariationFragment
>;

export const HealthFactorErrorFragment = graphql(
  `fragment HealthFactorError on HealthFactorError {
    __typename
    reason
    current
    after
  }`,
);
export type HealthFactorError = FragmentOf<typeof HealthFactorErrorFragment>;

export type HealthFactorResult = HealthFactorVariation | HealthFactorError;

export const HealthFactorResultFragment: FragmentDocumentFor<
  HealthFactorResult,
  'HealthFactorResult'
> = graphql(
  `fragment HealthFactorResult on HealthFactorResult {
    __typename
    ... on HealthFactorVariation {
      ...HealthFactorVariation
    }
    ... on HealthFactorError {
      ...HealthFactorError
    }
  }`,
  [HealthFactorVariationFragment, HealthFactorErrorFragment],
);
