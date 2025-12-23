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

function randomBase64String(): string {
  return atob(crypto.randomUUID());
}

/**
 * @internal
 */
export function percentNumber(value: number, decimals = 6): PercentNumber {
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
export function decimalNumber(value: number, decimals = 18): DecimalNumber {
  return {
    __typename: 'DecimalNumber',
    value: bigDecimal(value),
    onChainValue: BigInt(
      bigDecimal(value).rescale(decimals).toApproximateNumber(),
    ),
    decimals,
  };
}

function randomHexString(size: number): `0x${string}` {
  return [...Array<string>(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('') as `0x${string}`;
}

/**
 * @internal
 */
export function randomEvmAddress(): EvmAddress {
  return evmAddress(`0x${randomHexString(20 * 2)}`);
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

export function tokenInfo(symbol: keyof typeof TestTokens): TokenInfo {
  const { name, decimals } = TestTokens[symbol];

  return {
    __typename: 'TokenInfo',
    id: tokenInfoId(randomBase64String()),
    name,
    symbol,
    decimals,
    icon: 'https://example.com/icon.png',
    categories: [],
  };
}

export function chain(): Chain {
  return {
    __typename: 'Chain',
    name: 'Ethereum',
    icon: 'https://example.com/icon.png',
    chainId: chainId(1),
    rpcUrl: 'https://example.com/rpc.json',
    explorerUrl: 'https://example.com/explorer.json',
    isTestnet: false,
    isFork: false,
    nativeWrappedToken: randomEvmAddress(),
    nativeGateway: randomEvmAddress(),
    signatureGateway: randomEvmAddress(),
    nativeInfo: tokenInfo('WETH'),
  };
}

export function erc20Token(symbol: keyof typeof TestTokens): Erc20Token {
  const { isWrappedNativeToken } = TestTokens[symbol];

  return {
    __typename: 'Erc20Token',
    address: randomEvmAddress(),
    chain: chain(),
    info: tokenInfo(symbol),
    isWrappedNativeToken,
    permitSupported: false,
  };
}

export function exchangeAmount(value: number): ExchangeAmount {
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
export function erc20Amount(
  value: number,
  symbol: keyof typeof TestTokens,
): Erc20Amount {
  return {
    __typename: 'Erc20Amount',
    amount: decimalNumber(value, TestTokens[symbol].decimals),
    token: erc20Token(symbol),
    exchange: exchangeAmount(value),
    exchangeRate: decimalNumber(value),
  };
}
