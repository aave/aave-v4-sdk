import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';

export const DecimalValueFragment = graphql(
  `fragment DecimalValue on DecimalValue {
    __typename
    raw
    decimals
    formatted
  }`,
);
export type DecimalValue = FragmentOf<typeof DecimalValueFragment>;

export const PercentValueFragment = graphql(
  `fragment PercentValue on PercentValue {
    __typename
    raw
    decimals
    value
    formatted
  }`,
);
export type PercentValue = FragmentOf<typeof PercentValueFragment>;

export const FiatAmountFragment = graphql(
  `fragment FiatAmount on FiatAmount {
    __typename
    value
    name
    symbol
  }`,
  [DecimalValueFragment],
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

export const Erc20TokenFragment = graphql(
  `fragment Erc20Token on Erc20Token {
    __typename
    info {
      ...TokenInfo
    }
    contract
  }`,
  [TokenInfoFragment],
);
export type Erc20Token = FragmentOf<typeof Erc20TokenFragment>;

export const NativeTokenFragment = graphql(
  `fragment NativeToken on NativeToken {
    __typename
    info {
      ...TokenInfo
    }
  }`,
  [TokenInfoFragment],
);
export type NativeToken = FragmentOf<typeof NativeTokenFragment>;

export const Erc20AmountFragment = graphql(
  `fragment Erc20Amount on Erc20Amount {
    __typename
    token {
      ...Erc20Token
    }
    value {
      ...DecimalValue
    }
    fiatAmount(currency: $currency){
      ...FiatAmount
    }
    fiatRate(currency: $currency){
      ...DecimalValue
    }
    isWrappedNative
  }`,
  [Erc20TokenFragment, DecimalValueFragment, FiatAmountFragment],
);
export type Erc20Amount = FragmentOf<typeof Erc20AmountFragment>;

export const NativeAmountFragment = graphql(
  `fragment NativeAmount on NativeAmount {
    __typename
    token {
      ...NativeToken
    }
    value {
      ...DecimalValue
    }
  }`,
  [NativeTokenFragment, DecimalValueFragment],
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
    amount {
      ...FiatAmount
    }
    change(window: $timeWindow){
      ...PercentValue
    }
  }`,
  [FiatAmountFragment, PercentValueFragment],
);
export type FiatAmountWithChange = FragmentOf<
  typeof FiatAmountWithChangeFragment
>;

export const PercentValueWithChangeFragment = graphql(
  `fragment PercentValueWithChange on PercentValueWithChange {
    __typename
    amount {
      ...PercentValue
    }
    change(window: $timeWindow){
      ...PercentValue
    }
  }`,
  [PercentValueFragment],
);
export type PercentValueWithChange = FragmentOf<
  typeof PercentValueWithChangeFragment
>;

export const BigDecimalWithChangeFragment = graphql(
  `fragment BigDecimalWithChange on BigDecimalWithChange {
    __typename
    value
    change(window: $timeWindow){
      ...PercentValue
    }
  }`,
  [PercentValueFragment],
);
export type BigDecimalWithChange = FragmentOf<
  typeof BigDecimalWithChangeFragment
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

export const BigDecimalVariationFragment = graphql(
  `fragment BigDecimalVariation on BigDecimalVariation {
    __typename
    current {
      ...PercentValue
    }
    after {
      ...PercentValue
    }
  }`,
  [PercentValueFragment],
);
export type BigDecimalVariation = FragmentOf<
  typeof BigDecimalVariationFragment
>;

export const PercentValueVariationFragment = graphql(
  `fragment PercentValueVariation on PercentValueVariation {
    __typename
    current {
      ...PercentValue
    }
    after {
      ...PercentValue
    }
  }`,
  [PercentValueFragment],
);
export type PercentValueVariation = FragmentOf<
  typeof PercentValueVariationFragment
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
