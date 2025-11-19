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

export const FiatAmountFragment = graphql(
  `fragment FiatAmount on FiatAmount {
    __typename
    value
    name
    symbol
  }`,
);
export type FiatAmount = FragmentOf<typeof FiatAmountFragment>;

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
    fiatAmount(currency: $currency){
      ...FiatAmount
    }
    fiatRate(currency: $currency){
      ...DecimalNumber
    }
  }`,
  [Erc20TokenFragment, DecimalNumberFragment, FiatAmountFragment],
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
    fiatAmount(currency: $currency){
      ...FiatAmount
    }
    fiatRate(currency: $currency){
      ...DecimalNumber
    }
  }`,
  [NativeTokenFragment, DecimalNumberFragment, FiatAmountFragment],
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

export const FiatAmountWithChangeFragment = graphql(
  `fragment FiatAmountWithChange on FiatAmountWithChange {
    __typename
    current {
      ...FiatAmount
    }
    change(window: $timeWindow){
      ...PercentNumber
    }
  }`,
  [FiatAmountFragment, PercentNumberFragment],
);
export type FiatAmountWithChange = FragmentOf<
  typeof FiatAmountWithChangeFragment
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

export const FiatAmountValueVariationFragment = graphql(
  `fragment FiatAmountValueVariation on FiatAmountValueVariation {
    __typename
    current {
      ...FiatAmount
    }
    after {
      ...FiatAmount
    }
  }`,
  [FiatAmountFragment],
);
export type FiatAmountValueVariation = FragmentOf<
  typeof FiatAmountValueVariationFragment
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
