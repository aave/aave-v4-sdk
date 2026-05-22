import { describe, expect, it } from 'vitest';
import type { AssetOverride } from './config';
import {
  buildAssetOverrideMap,
  deepTransformTokens,
  type Erc20TokenShape,
  isErc20Token,
  transformErc20Token,
} from './displayTransform';

const makeToken = (
  overrides: Partial<Erc20TokenShape> = {},
): Erc20TokenShape => ({
  __typename: 'Erc20Token',
  info: {
    __typename: 'TokenInfo',
    id: 'wrapped-token-info-id',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    icon: 'weth.svg',
  },
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  chain: {
    chainId: 1,
    nativeInfo: {
      __typename: 'TokenInfo',
      id: 'native-token-info-id',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      icon: 'eth.svg',
    },
  },
  isWrappedNativeToken: true,
  ...overrides,
});

describe('isErc20Token', () => {
  it('returns true for a valid Erc20Token shape', () => {
    expect(isErc20Token(makeToken())).toBe(true);
  });

  it('returns false for null', () => {
    expect(isErc20Token(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isErc20Token([])).toBe(false);
  });

  it('returns false for objects with a different __typename', () => {
    expect(isErc20Token({ __typename: 'HubAsset' })).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isErc20Token('Erc20Token')).toBe(false);
  });
});


describe('buildAssetOverrideMap', () => {
  it('builds a map keyed by chainId:address (lowercased)', () => {
    const overrides: AssetOverride[] = [
      {
        chainId: 1,
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        display: { symbol: 'ETH' },
      },
    ];
    const map = buildAssetOverrideMap(overrides);
    expect(map.has('1:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')).toBe(true);
  });

  it('normalises mixed-case addresses to lowercase', () => {
    const overrides: AssetOverride[] = [
      { chainId: 1, address: '0xABCDEF', display: { name: 'Test' } },
    ];
    const map = buildAssetOverrideMap(overrides);
    expect(map.has('1:0xabcdef')).toBe(true);
    expect(map.has('1:0xABCDEF')).toBe(false);
  });

  it('returns an empty map for an empty array', () => {
    expect(buildAssetOverrideMap([]).size).toBe(0);
  });

  it('keys include the chainId so different chains do not collide', () => {
    const overrides: AssetOverride[] = [
      { chainId: 1, address: '0xABCD', display: { name: 'Mainnet' } },
      { chainId: 137, address: '0xABCD', display: { name: 'Polygon' } },
    ];
    const map = buildAssetOverrideMap(overrides);
    expect(map.get('1:0xabcd')?.display.name).toBe('Mainnet');
    expect(map.get('137:0xabcd')?.display.name).toBe('Polygon');
  });
});

describe('transformErc20Token', () => {
  describe('when applyWrappedNative is true', () => {
    it('replaces info with nativeInfo for a wrapped native token', () => {
      const token = makeToken();
      const result = transformErc20Token(token, true, null);
      expect(result.info).toEqual({
        ...token.chain.nativeInfo,
        id: token.info.id,
      });
    });

    it('preserves the original token info id for consumer-facing identity stability', () => {
      const token = makeToken();
      const result = transformErc20Token(token, true, null);
      expect(result.info.id).toBe(token.info.id);
      expect(result.info.id).not.toBe(token.chain.nativeInfo.id);
    });

    it('does not modify a non-wrapped token', () => {
      const token = makeToken({ isWrappedNativeToken: false });
      const result = transformErc20Token(token, true, null);
      expect(result).toBe(token);
    });
  });

  describe('when applyWrappedNative is false', () => {
    it('does not modify any token regardless of isWrappedNativeToken', () => {
      const token = makeToken();
      const result = transformErc20Token(token, false, null);
      expect(result).toBe(token);
    });
  });

  describe('with an asset override map', () => {
    it('applies name, symbol, and icon overrides', () => {
      const token = makeToken({ isWrappedNativeToken: false });
      const overrides: AssetOverride[] = [
        {
          chainId: 1,
          address: token.address,
          display: { name: 'Custom Name', symbol: 'CUST', icon: 'custom.svg' },
        },
      ];
      const overrideMap = buildAssetOverrideMap(overrides);
      const result = transformErc20Token(token, false, overrideMap);
      expect(result.info.name).toBe('Custom Name');
      expect(result.info.symbol).toBe('CUST');
      expect(result.info.icon).toBe('custom.svg');
    });

    it('applies only the override fields that are defined', () => {
      const token = makeToken({ isWrappedNativeToken: false });
      const overrides: AssetOverride[] = [
        { chainId: 1, address: token.address, display: { symbol: 'CUST' } },
      ];
      const overrideMap = buildAssetOverrideMap(overrides);
      const result = transformErc20Token(token, false, overrideMap);
      expect(result.info.symbol).toBe('CUST');
      expect(result.info.name).toBe(token.info.name);
      expect(result.info.icon).toBe(token.info.icon);
    });

    it('returns the original token unchanged when the address is not in the map', () => {
      const token = makeToken({ isWrappedNativeToken: false });
      const overrides: AssetOverride[] = [
        {
          chainId: 1,
          address: '0x0000000000000000000000000000000000000000',
          display: { symbol: 'OTHER' },
        },
      ];
      const overrideMap = buildAssetOverrideMap(overrides);
      const result = transformErc20Token(token, false, overrideMap);
      expect(result).toBe(token);
    });

    it('override is applied after the native-info replacement', () => {
      const token = makeToken();
      const overrides: AssetOverride[] = [
        { chainId: 1, address: token.address, display: { symbol: 'OVERRIDE' } },
      ];
      const overrideMap = buildAssetOverrideMap(overrides);
      const result = transformErc20Token(token, true, overrideMap);
      // nativeInfo applied first, then override patches symbol
      expect(result.info.name).toBe(token.chain.nativeInfo.name);
      expect(result.info.symbol).toBe('OVERRIDE');
    });
  });
});

describe('deepTransformTokens', () => {
  it('returns the same reference for null', () => {
    expect(deepTransformTokens(null, true, null)).toBeNull();
  });

  it('returns the same reference for primitives', () => {
    expect(deepTransformTokens(42, true, null)).toBe(42);
  });

  it('returns the same reference when no tokens are present', () => {
    const data = { foo: 'bar', nested: { baz: 1 } };
    expect(deepTransformTokens(data, true, null)).toBe(data);
  });

  it('returns the same array reference when no tokens are transformed', () => {
    const data = [{ foo: 'bar' }, { baz: 42 }];
    expect(deepTransformTokens(data, true, null)).toBe(data);
  });

  it('returns the same object reference when no tokens are transformed in a nested structure', () => {
    const token = makeToken({ isWrappedNativeToken: false });
    const data = { reserves: [token] };
    expect(deepTransformTokens(data, true, null)).toBe(data);
  });

  describe('withinReserve scoping', () => {
    it('does not transform a wrapped native token outside any reserve context', () => {
      const token = makeToken();
      const data = { balances: [{ __typename: 'Erc20Amount', token }] };
      expect(deepTransformTokens(data, true, null)).toBe(data);
    });

    it('transforms a wrapped native token inside a HubAsset', () => {
      const token = makeToken();
      const data = { __typename: 'HubAsset', underlying: token };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.underlying as Erc20TokenShape).info).toEqual({
        ...token.chain.nativeInfo,
        id: token.info.id,
      });
      expect(result).not.toBe(data);
    });

    it('transforms a wrapped native token inside an Asset', () => {
      const token = makeToken();
      const data = { __typename: 'Asset', token };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.token as Erc20TokenShape).info.symbol).toBe('ETH');
    });

    it('transforms a wrapped native token inside a Reserve', () => {
      const token = makeToken();
      const data = {
        __typename: 'Reserve',
        summary: { supplied: { __typename: 'Erc20Amount', token } },
      };
      const result = deepTransformTokens(data, true, null) as typeof data;
      const suppliedToken = result.summary.supplied.token as Erc20TokenShape;
      expect(suppliedToken.info.symbol).toBe('ETH');
    });

    it('does not transform a wrapped native token that is a reward payout inside a Reserve', () => {
      const token = makeToken();
      const data = {
        __typename: 'Reserve',
        summary: {
          rewards: [{ __typename: 'MerklSupplyReward', payoutToken: token }],
        },
      };
      const result = deepTransformTokens(data, true, null) as typeof data;
      const rewardToken = result.summary.rewards[0]!
        .payoutToken as Erc20TokenShape;
      expect(rewardToken.info.symbol).toBe('WETH');
      expect(result.summary.rewards[0]!.payoutToken).toBe(token);
    });

    it('suppresses the transform for MerklBorrowReward payout tokens', () => {
      const token = makeToken();
      const data = {
        __typename: 'HubAsset',
        rewards: [{ __typename: 'MerklBorrowReward', payoutToken: token }],
        underlying: makeToken({ isWrappedNativeToken: false }),
      };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.rewards[0]!.payoutToken as Erc20TokenShape).info.symbol).toBe('WETH');
    });

    it('suppresses the transform for ReserveUserState tokens inside a Reserve', () => {
      const token = makeToken();
      const data = {
        __typename: 'Reserve',
        userState: { __typename: 'ReserveUserState', token },
      };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.userState.token as Erc20TokenShape).info.symbol).toBe('WETH');
      expect(result.userState.token).toBe(token);
    });

    it('suppresses the transform for HubAssetUserState tokens inside a HubAsset', () => {
      const token = makeToken();
      const data = {
        __typename: 'HubAsset',
        userState: { __typename: 'HubAssetUserState', token },
      };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.userState.token as Erc20TokenShape).info.symbol).toBe('WETH');
      expect(result.userState.token).toBe(token);
    });

    it('transforms a wrapped native token inside a HubSpokeConfig', () => {
      const token = makeToken();
      const data = { __typename: 'HubSpokeConfig', token };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.token as Erc20TokenShape).info.symbol).toBe('ETH');
    });

    it('transforms a wrapped native token inside a CollateralFactorVariation', () => {
      const token = makeToken();
      const data = { __typename: 'CollateralFactorVariation', token };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.token as Erc20TokenShape).info.symbol).toBe('ETH');
    });

    it('transforms Erc20Token items in an array inside a HubAsset', () => {
      const token = makeToken();
      const data = {
        __typename: 'HubAsset',
        amounts: [{ __typename: 'Erc20Amount', token }],
      };
      const result = deepTransformTokens(data, true, null) as typeof data;
      expect((result.amounts[0]!.token as Erc20TokenShape).info.symbol).toBe('ETH');
      expect(result).not.toBe(data);
    });

    it('does not apply wrapped native transform when applyWrappedNative is false even inside a HubAsset', () => {
      const token = makeToken();
      const data = { __typename: 'HubAsset', underlying: token };
      expect(deepTransformTokens(data, false, null)).toBe(data);
    });
  });

  describe('asset override map', () => {
    it('applies overrides to tokens outside reserve context', () => {
      const token = makeToken({ isWrappedNativeToken: false });
      const overrides: AssetOverride[] = [
        { chainId: 1, address: token.address, display: { symbol: 'CUSTSYM' } },
      ];
      const overrideMap = buildAssetOverrideMap(overrides);
      const result = deepTransformTokens({ token }, false, overrideMap) as {
        token: Erc20TokenShape;
      };
      expect(result.token.info.symbol).toBe('CUSTSYM');
    });

    it('applies overrides to tokens inside reserve context', () => {
      const token = makeToken({ isWrappedNativeToken: false });
      const overrides: AssetOverride[] = [
        { chainId: 1, address: token.address, display: { symbol: 'CUSTSYM' } },
      ];
      const overrideMap = buildAssetOverrideMap(overrides);
      const data = { __typename: 'HubAsset', underlying: token };
      const result = deepTransformTokens(data, false, overrideMap) as typeof data;
      expect((result.underlying as Erc20TokenShape).info.symbol).toBe('CUSTSYM');
    });
  });
});
