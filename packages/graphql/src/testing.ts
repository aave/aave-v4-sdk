import { bigDecimal, chainId, type EvmAddress, evmAddress } from '@aave/types';
import type {
  Chain,
  DecimalNumber,
  Erc20Amount,
  Erc20Token,
  ExchangeAmount,
  PercentNumber,
  TokenInfo,
} from './fragments';
import { tokenInfoId } from './id';

function mockRandomBase64String(): string {
  return atob(crypto.randomUUID());
}

/**
 * @internal
 */
export function mockPercentNumber(value: number, decimals = 6): PercentNumber {
  const normalized = bigDecimal(value);

  return {
    __typename: 'PercentNumber',
    value: normalized.div(2),
    normalized,
    onChainValue: BigInt(normalized.rescale(decimals).toApproximateNumber()),
    decimals,
  };
}

/**
 * @internal
 */
export function mockDecimalNumber(value: number, decimals = 18): DecimalNumber {
  return {
    __typename: 'DecimalNumber',
    value: bigDecimal(value),
    onChainValue: BigInt(
      bigDecimal(value).rescale(decimals).toApproximateNumber(),
    ),
    decimals,
  };
}

function mockRandomHexString(size: number): `0x${string}` {
  return [...Array<string>(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('') as `0x${string}`;
}

/**
 * @internal
 */
export function mockEvmAddress(): EvmAddress {
  return evmAddress(`0x${mockRandomHexString(20 * 2)}`);
}

export const TestTokens = {
  WETH: {
    name: 'Wrapped Ether',
    decimals: 18,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    isWrappedNativeToken: true,
  },
  USDC: {
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    isWrappedNativeToken: false,
  },
  GHO: {
    name: 'Gho Token',
    decimals: 18,
    address: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
    isWrappedNativeToken: false,
  },
  AAVE: {
    name: 'Aave Token',
    decimals: 18,
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    isWrappedNativeToken: false,
  },
} as const;

export function mockTokenInfo(symbol: keyof typeof TestTokens): TokenInfo {
  const { name, decimals } = TestTokens[symbol];

  return {
    __typename: 'TokenInfo',
    id: tokenInfoId(mockRandomBase64String()),
    name,
    symbol,
    decimals,
    icon: 'https://example.com/icon.png',
    categories: [],
  };
}

export function mockChain(): Chain {
  return {
    __typename: 'Chain',
    name: 'Ethereum',
    icon: 'https://example.com/icon.png',
    chainId: chainId(1),
    rpcUrl: 'https://example.com/rpc.json',
    explorerUrl: 'https://example.com/explorer.json',
    isTestnet: false,
    isFork: false,
    nativeWrappedToken: mockEvmAddress(),
    nativeGateway: mockEvmAddress(),
    signatureGateway: mockEvmAddress(),
    nativeInfo: mockTokenInfo('WETH'),
  };
}

export function mockErc20Token(symbol: keyof typeof TestTokens): Erc20Token {
  const { isWrappedNativeToken } = TestTokens[symbol];

  return {
    __typename: 'Erc20Token',
    address: mockEvmAddress(),
    chain: mockChain(),
    info: mockTokenInfo(symbol),
    isWrappedNativeToken,
    permitSupported: false,
  };
}

export function mockExchangeAmount(value: number): ExchangeAmount {
  return {
    __typename: 'ExchangeAmount',
    value: bigDecimal(value),
    name: 'USD',
    symbol: '$',
    icon: 'https://example.com/icon.png',
    decimals: 2,
  };
}

/**
 * @internal
 */
export function mockErc20Amount(
  value: number,
  symbol: keyof typeof TestTokens,
): Erc20Amount {
  return {
    __typename: 'Erc20Amount',
    amount: mockDecimalNumber(value, TestTokens[symbol].decimals),
    token: mockErc20Token(symbol),
    exchange: mockExchangeAmount(value),
    exchangeRate: mockDecimalNumber(value),
  };
}
