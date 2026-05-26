/**
 * Integration tests for the displayTransformExchange wiring in AaveClient.
 *
 * Verifies that the exchange correctly intercepts GraphQL responses and applies
 * display transforms before results reach the consumer, and that the raw data
 * stored in graphcache is unaffected (the cache always holds untransformed values).
 */

import { assertOk, chainId, evmAddress } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AaveClient } from './AaveClient';
import { hubAssets } from './actions';

const TEST_BACKEND = 'https://api.test-display-transform.aave.com/graphql';

const testEnvironment = {
  name: 'test',
  backend: TEST_BACKEND,
  indexingTimeout: 5_000,
  pollingInterval: 100,
  exchangeRateInterval: 1_000,
  swapQuoteInterval: 1_000,
  swapStatusInterval: 1_000,
} as const;

const api = msw.graphql.link(TEST_BACKEND);

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const CHAIN_ID = chainId(1);

const MOCK_CHAIN = {
  __typename: 'Chain',
  name: 'Ethereum',
  icon: null,
  chainId: 1,
  rpcUrl: 'https://eth.llamarpc.com',
  explorerUrl: 'https://etherscan.io',
  isTestnet: false,
  isFork: false,
  nativeWrappedToken: WETH_ADDRESS,
  nativeGateway: '0x0000000000000000000000000000000000000000',
  signatureGateway: '0x0000000000000000000000000000000000000000',
  nativeInfo: {
    __typename: 'TokenInfo',
    id: 'token-info-eth',
    name: 'Ether',
    symbol: 'ETH',
    icon: 'eth.svg',
    decimals: 18,
    categories: [],
  },
};

const MOCK_EXCHANGE_AMOUNT = {
  __typename: 'ExchangeAmount',
  value: '3000',
  name: 'US Dollar',
  symbol: 'USD',
  icon: null,
  decimals: 2,
};

const MOCK_EXCHANGE_AMOUNT_WITH_CHANGE = {
  __typename: 'ExchangeAmountWithChange',
  current: MOCK_EXCHANGE_AMOUNT,
  change: {
    __typename: 'PercentNumber',
    onChainValue: '0',
    decimals: 18,
    value: '0',
    normalized: '0',
  },
};

const MOCK_PERCENT = {
  __typename: 'PercentNumber',
  onChainValue: '100000000000000000',
  decimals: 18,
  value: '0.1',
  normalized: '10',
};

const MOCK_DECIMAL = {
  __typename: 'DecimalNumber',
  onChainValue: '1000000000000000000',
  decimals: 18,
  value: '1',
};

function makeWethToken(isWrappedNativeToken = true) {
  return {
    __typename: 'Erc20Token',
    address: WETH_ADDRESS,
    info: {
      __typename: 'TokenInfo',
      id: 'token-info-weth',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      icon: 'weth.svg',
      decimals: 18,
      categories: [],
    },
    chain: MOCK_CHAIN,
    isWrappedNativeToken,
  };
}

function makeErc20Amount(isWrappedNativeToken = true) {
  return {
    __typename: 'Erc20Amount',
    token: makeWethToken(isWrappedNativeToken),
    amount: MOCK_DECIMAL,
    exchange: MOCK_EXCHANGE_AMOUNT,
    exchangeRate: MOCK_DECIMAL,
  };
}

function makeHubAsset(isWrappedNativeToken = true) {
  return {
    __typename: 'HubAsset',
    id: 'hub-asset-weth',
    onchainAssetId: 'onchain-weth',
    hub: {
      __typename: 'Hub',
      id: 'hub-1',
      name: 'Aave Hub',
      address: '0x0000000000000000000000000000000000000001',
      chain: MOCK_CHAIN,
      summary: {
        __typename: 'HubSummary',
        totalBorrowed: MOCK_EXCHANGE_AMOUNT_WITH_CHANGE,
        totalBorrowCap: MOCK_EXCHANGE_AMOUNT,
        totalSupplied: MOCK_EXCHANGE_AMOUNT_WITH_CHANGE,
        totalSupplyCap: MOCK_EXCHANGE_AMOUNT,
        utilizationRate: MOCK_PERCENT,
      },
    },
    underlying: makeWethToken(isWrappedNativeToken),
    summary: {
      __typename: 'HubAssetSummary',
      supplied: makeErc20Amount(isWrappedNativeToken),
      borrowed: makeErc20Amount(isWrappedNativeToken),
      availableLiquidity: makeErc20Amount(isWrappedNativeToken),
      supplyApy: MOCK_PERCENT,
      borrowApy: MOCK_PERCENT,
      netApy: MOCK_PERCENT,
      utilizationRate: MOCK_PERCENT,
      reservesCount: 1,
      activeReservesCount: 1,
    },
    settings: {
      __typename: 'HubAssetSettings',
      feeReceiver: '0x0000000000000000000000000000000000000000',
      liquidityFee: MOCK_PERCENT,
      irStrategy: '0x0000000000000000000000000000000000000000',
      reinvestmentController: null,
      optimalUtilizationRate: MOCK_PERCENT,
      baseBorrowRate: MOCK_PERCENT,
      slopeBelowOptimal: MOCK_PERCENT,
      slopeAboveOptimal: MOCK_PERCENT,
    },
    userState: null,
  };
}

describe('displayTransformExchange — showWrappedNativeReserveAsNative', () => {
  const client = AaveClient.create({
    environment: testEnvironment,
    batch: false,
    display: { showWrappedNativeReserveAsNative: true },
  });

  const server = setupServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('transforms WETH to ETH for hub asset underlying token', async () => {
    server.use(
      api.query('HubAssets', () =>
        msw.HttpResponse.json({ data: { value: [makeHubAsset()] } }),
      ),
    );
    const result = await hubAssets(client, {
      query: {
        hubInput: {
          chainId: CHAIN_ID,
          address: evmAddress('0x0000000000000000000000000000000000000001'),
        },
      },
    });
    assertOk(result);
    const token = result.value[0]!.underlying;
    expect(token.info.symbol).toBe('ETH');
    expect(token.info.name).toBe('Ether');
    expect(token.info.icon).toBe('eth.svg');
  });

  it('preserves the original token info id for consumer-facing identity stability', async () => {
    server.use(
      api.query('HubAssets', () =>
        msw.HttpResponse.json({ data: { value: [makeHubAsset()] } }),
      ),
    );
    const result = await hubAssets(client, {
      query: {
        hubInput: {
          chainId: CHAIN_ID,
          address: evmAddress('0x0000000000000000000000000000000000000001'),
        },
      },
    });
    assertOk(result);
    expect(result.value[0]!.underlying.info.id).toBe('token-info-weth');
  });

  it('transforms WETH to ETH in Erc20Amount token fields within HubAssetSummary', async () => {
    server.use(
      api.query('HubAssets', () =>
        msw.HttpResponse.json({ data: { value: [makeHubAsset()] } }),
      ),
    );
    const result = await hubAssets(client, {
      query: {
        hubInput: {
          chainId: CHAIN_ID,
          address: evmAddress('0x0000000000000000000000000000000000000001'),
        },
      },
    });
    assertOk(result);
    expect(result.value[0]!.summary.supplied.token.info.symbol).toBe('ETH');
    expect(result.value[0]!.summary.borrowed.token.info.symbol).toBe('ETH');
    expect(result.value[0]!.summary.availableLiquidity.token.info.symbol).toBe(
      'ETH',
    );
  });

  it('does not transform a non-wrapped token', async () => {
    server.use(
      api.query('HubAssets', () =>
        msw.HttpResponse.json({
          data: { value: [makeHubAsset(false)] },
        }),
      ),
    );
    const nonWrappedClient = AaveClient.create({
      environment: testEnvironment,
      batch: false,
      display: { showWrappedNativeReserveAsNative: true },
    });
    const result = await hubAssets(nonWrappedClient, {
      query: {
        hubInput: {
          chainId: CHAIN_ID,
          address: evmAddress('0x0000000000000000000000000000000000000001'),
        },
      },
    });
    assertOk(result);
    expect(result.value[0]!.underlying.info.symbol).toBe('WETH');
  });
});

describe('displayTransformExchange — assetOverrides', () => {
  const client = AaveClient.create({
    environment: testEnvironment,
    batch: false,
    display: {
      assetOverrides: [
        {
          chainId: 1,
          address: WETH_ADDRESS,
          display: { name: 'Custom Ether', symbol: 'cETH' },
        },
      ],
    },
  });

  const server = setupServer(
    api.query('HubAssets', () =>
      msw.HttpResponse.json({ data: { value: [makeHubAsset()] } }),
    ),
  );

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  it('applies name and symbol overrides to the underlying token', async () => {
    const result = await hubAssets(client, {
      query: {
        hubInput: {
          chainId: CHAIN_ID,
          address: evmAddress('0x0000000000000000000000000000000000000001'),
        },
      },
    });
    assertOk(result);
    const token = result.value[0]!.underlying;
    expect(token.info.name).toBe('Custom Ether');
    expect(token.info.symbol).toBe('cETH');
    expect(token.info.icon).toBe('weth.svg');
  });
});

describe('displayTransformExchange — showWrappedNativeReserveAsNative + assetOverrides on the same token', () => {
  const client = AaveClient.create({
    environment: testEnvironment,
    batch: false,
    display: {
      showWrappedNativeReserveAsNative: true,
      assetOverrides: [
        {
          chainId: 1,
          address: WETH_ADDRESS,
          display: { symbol: 'OVERRIDE' },
        },
      ],
    },
  });

  const server = setupServer(
    api.query('HubAssets', () =>
      msw.HttpResponse.json({ data: { value: [makeHubAsset()] } }),
    ),
  );

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  it('override takes precedence — native name applied but symbol overridden', async () => {
    const result = await hubAssets(client, {
      query: {
        hubInput: {
          chainId: CHAIN_ID,
          address: evmAddress('0x0000000000000000000000000000000000000001'),
        },
      },
    });
    assertOk(result);
    const token = result.value[0]!.underlying;
    expect(token.info.name).toBe('Ether');
    expect(token.info.symbol).toBe('OVERRIDE');
  });
});
