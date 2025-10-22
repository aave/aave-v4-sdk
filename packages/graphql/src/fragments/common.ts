import type { BigDecimal } from '@aave/types-next';
import type { FragmentOf } from 'gql.tada';
import { type FragmentDocumentFor, graphql } from '../graphql';

export type DecimalNumber = {
  __typename: 'DecimalNumber';
  onChainValue: bigint;
  decimals: number;
  value: BigDecimal;
  /**
   * @deprecated Use `value` instead. Removal slated for week commencing 27th October 2025.
   */
  formatted: BigDecimal;
  /**
   * @deprecated Use `onChainValue` instead. Removal slated for week commencing 27th October 2025.
   */
  raw: bigint;
};

export const DecimalNumberFragment: FragmentDocumentFor<DecimalNumber> =
  graphql(`fragment DecimalNumber on DecimalNumber {
    __typename
    onChainValue
    decimals
    value
    formatted: value
    raw: onChainValue
  }`);

/**
 * @deprecated Use {@link DecimalNumber} instead. Removal slated for week commencing 27th October 2025.
 */
export type DecimalValue = DecimalNumber;

export type DecimalNumberWithChange = {
  __typename: 'DecimalNumberWithChange';
  current: DecimalNumber;
  change: DecimalNumber;
};
export const DecimalNumberWithChangeFragment: FragmentDocumentFor<DecimalNumberWithChange> =
  graphql(
    `fragment DecimalNumberWithChange on DecimalNumberWithChange {
    __typename
    current {
      ...DecimalNumber
    }
    change(window: $timeWindow) {
      ...DecimalNumber
    }
  }`,
    [DecimalNumberFragment],
  );

export type PercentNumber = {
  __typename: 'PercentNumber';
  onChainValue: bigint;
  decimals: number;
  value: BigDecimal;
  normalized: BigDecimal;
  /**
   * @deprecated Use `normalized` instead. Removal slated for week commencing 27th October 2025.
   */
  formatted: BigDecimal;
  /**
   * @deprecated Use `onChainValue` instead. Removal slated for week commencing 27th October 2025.
   */
  raw: bigint;
};

export const PercentNumberFragment: FragmentDocumentFor<PercentNumber> =
  graphql(`fragment PercentNumber on PercentNumber {
    __typename
    onChainValue
    decimals
    value
    normalized
    raw: onChainValue
    formatted: value
  }`);

/**
 * @deprecated Use {@link PercentNumber} instead. Removal slated for week commencing 27th October 2025.
 */
export type PercentValue = PercentNumber;

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

export type Erc20Amount = {
  __typename: 'Erc20Amount';
  token: Erc20Token;
  amount: DecimalNumber;
  fiatAmount: FiatAmount;
  fiatRate: DecimalNumber;
  isWrappedNative: boolean;
  /**
   * @deprecated Use `value` instead. Removal slated for week commencing 27th October 2025.
   */
  value: DecimalNumber;
};
export const Erc20AmountFragment: FragmentDocumentFor<Erc20Amount> = graphql(
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
    isWrappedNative
    value: amount {
      ...DecimalNumber
    }
  }`,
  [Erc20TokenFragment, DecimalNumberFragment, FiatAmountFragment],
);

export type NativeAmount = {
  __typename: 'NativeAmount';
  token: NativeToken;
  amount: DecimalNumber;
  fiatAmount: FiatAmount;
  fiatRate: DecimalNumber;
  /**
   * @deprecated Use `value` instead. Removal slated for week commencing 27th October 2025.
   */
  value: DecimalNumber;
};

export const NativeAmountFragment: FragmentDocumentFor<NativeAmount> = graphql(
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
    value: amount {
      ...DecimalNumber
    }
  }`,
  [NativeTokenFragment, DecimalNumberFragment, FiatAmountFragment],
);

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

export type FiatAmountWithChange = {
  __typename: 'FiatAmountWithChange';
  current: FiatAmount;
  change: PercentNumber;
  /**
   * @deprecated Use `current` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: FiatAmount;
};
export const FiatAmountWithChangeFragment: FragmentDocumentFor<FiatAmountWithChange> =
  graphql(
    `fragment FiatAmountWithChange on FiatAmountWithChange {
    __typename
    current {
      ...FiatAmount
    }
    change(window: $timeWindow){
      ...PercentNumber
    }
    amount: current {
      ...FiatAmount
    }
  }`,
    [FiatAmountFragment, PercentNumberFragment],
  );

export type PercentNumberWithChange = {
  __typename: 'PercentNumberWithChange';
  current: PercentNumber;
  change: PercentNumber;
  /**
   * @deprecated Use `current` instead. Removal slated for week commencing 27th October 2025.
   */
  amount: PercentNumber;
};

export const PercentNumberWithChangeFragment: FragmentDocumentFor<PercentNumberWithChange> =
  graphql(
    `fragment PercentNumberWithChange on PercentNumberWithChange {
    __typename
    current {
      ...PercentNumber
    }
    change(window: $timeWindow){
      ...PercentNumber
    }
    amount: current {
      ...PercentNumber
    }
  }`,
    [PercentNumberFragment],
  );

/**
 * @deprecated Use {@link PercentNumberWithChange} instead. Removal slated for week commencing 27th October 2025.
 */
export type PercentValueWithChange = PercentNumberWithChange;

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
/**
 * @deprecated Use {@link PercentNumberVariation} instead. Removal slated for week commencing 27th October 2025.
 */
export type PercentValueVariation = PercentNumberVariation;

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

export type HealthFactorWithChange = {
  __typename: 'HealthFactorWithChange';
  current: BigDecimal;
  change: PercentNumber;
  /**
   * @deprecated Use `current` instead. Removal slated for week commencing 27th October 2025.
   */
  value: BigDecimal;
};
export const HealthFactorWithChangeFragment = graphql(
  `fragment HealthFactorWithChange on HealthFactorWithChange {
    __typename
    current
    change(window: $timeWindow) {
      ...PercentNumber
    }
    value: current
  }`,
  [PercentNumberFragment],
);
/**
 * @deprecated Use {@link HealthFactorWithChange} instead. Removal slated for week commencing 27th October 2025.
 */
export type HealthFactorChange = HealthFactorWithChange;

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
