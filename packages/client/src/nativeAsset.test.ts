import type { Chain } from '@aave/graphql';
import {
  makeChain,
  makeSharedBalanceNativeAsset,
  makeWrappedNativeAsset,
} from '@aave/graphql/testing';
import { describe, expect, it } from 'vitest';
import {
  hasDistinctWrappedNative,
  nativeErc20Address,
  nativeGatewayAddress,
  nativeTokenInfo,
  wrappedNativeTokenAddress,
} from './nativeAsset';

const wrappedChain = (): Chain => ({
  ...makeChain(),
  nativeAsset: makeWrappedNativeAsset(),
});

const sharedBalanceChain = (): Chain => ({
  ...makeChain(),
  nativeAsset: makeSharedBalanceNativeAsset(),
});

describe('Given a chain whose native token has a wrapper', () => {
  it('Then the native token is the unwrapped asset', () => {
    const chain = wrappedChain();
    expect(nativeTokenInfo(chain)?.symbol).toBe('ETH');
  });

  it('Then the wrapper address is reported for both address accessors', () => {
    const chain = wrappedChain();
    const expected =
      chain.nativeAsset?.__typename === 'WrappedNativeAsset'
        ? chain.nativeAsset.wrappedNativeTokenAddress
        : null;

    expect(wrappedNativeTokenAddress(chain)).toBe(expected);
    expect(nativeErc20Address(chain)).toBe(expected);
  });

  it('Then the native and wrapped tokens are distinct balances', () => {
    expect(hasDistinctWrappedNative(wrappedChain())).toBe(true);
  });
});

describe('Given a chain whose native token is itself an ERC20', () => {
  it('Then there is no wrapper to report', () => {
    const chain = sharedBalanceChain();
    expect(wrappedNativeTokenAddress(chain)).toBeNull();
    expect(nativeGatewayAddress(chain)).toBeNull();
  });

  it('Then the representative ERC20 is still reported', () => {
    const chain = sharedBalanceChain();
    const expected =
      chain.nativeAsset?.__typename === 'SharedBalanceNativeAsset'
        ? chain.nativeAsset.erc20Address
        : null;

    expect(nativeErc20Address(chain)).toBe(expected);
  });

  it('Then the two views are one balance, not two', () => {
    // This is what stops a consumer summing the native and ERC20 rows that
    // `userBalances` returns for a single holding on such a chain.
    expect(hasDistinctWrappedNative(sharedBalanceChain())).toBe(false);
  });

  it('Then the native token keeps its own full precision', () => {
    // The ERC20 view truncates to 6 decimals; the native view does not. Reading
    // the native token must not pick up the ERC20's scale.
    expect(nativeTokenInfo(sharedBalanceChain())?.decimals).toBe(18);
  });
});

describe('Given a chain with no native asset', () => {
  it('Then every wrapper accessor reports absence', () => {
    const chain: Chain = { ...makeChain(), nativeAsset: null };

    expect(nativeErc20Address(chain)).toBeNull();
    expect(wrappedNativeTokenAddress(chain)).toBeNull();
    expect(nativeGatewayAddress(chain)).toBeNull();
    expect(hasDistinctWrappedNative(chain)).toBe(false);
  });
});

describe('Given a chain whose native gateway is not deployed', () => {
  it('Then the gateway is null rather than the zero address', () => {
    const asset = makeWrappedNativeAsset();
    const chain: Chain = {
      ...makeChain(),
      nativeAsset:
        asset.__typename === 'WrappedNativeAsset'
          ? { ...asset, gateway: null }
          : asset,
    };

    expect(nativeGatewayAddress(chain)).toBeNull();
  });
});
