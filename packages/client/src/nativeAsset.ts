import type { Chain, TokenInfo } from '@aave/graphql';
import type { EvmAddress } from '@aave/types';

/**
 * The chain's native token — the asset gas is paid in.
 *
 * Returns `null` only for a chain with no native token at all, where gas is paid
 * in ordinary ERC20s. No such chain is supported today.
 */
export function nativeTokenInfo(chain: Chain): TokenInfo | null {
  switch (chain.nativeAsset?.__typename) {
    case 'WrappedNativeAsset':
    case 'SharedBalanceNativeAsset':
      return chain.nativeAsset.nativeToken;
    default:
      // Either the chain has no native asset, or the union gained a member this
      // version predates. Both are "no native token we can describe".
      return chain.nativeInfo ?? null;
  }
}

/**
 * The ERC20 that represents this chain's native asset: the wrapper on a chain
 * whose native token is wrapped, or the native token's own ERC20 face on a chain
 * where the native token *is* an ERC20.
 *
 * This is the address to use when matching a native balance against a reserve
 * underlying. Prefer it over {@link wrappedNativeTokenAddress}, which is `null`
 * on a chain that has no wrapper.
 */
export function nativeErc20Address(chain: Chain): EvmAddress | null {
  switch (chain.nativeAsset?.__typename) {
    case 'WrappedNativeAsset':
      return chain.nativeAsset.wrappedNativeTokenAddress;
    case 'SharedBalanceNativeAsset':
      return chain.nativeAsset.erc20Address;
    default:
      return null;
  }
}

/**
 * The wrapped native token's address, or `null` when this chain's native token
 * has no wrapper because it already is an ERC20 (e.g. USDC on Arc).
 *
 * A `null` here means "displaying the wrapper as the native token" is not a
 * meaningful operation on this chain — the two are the same asset.
 */
export function wrappedNativeTokenAddress(chain: Chain): EvmAddress | null {
  return chain.nativeAsset?.__typename === 'WrappedNativeAsset'
    ? chain.nativeAsset.wrappedNativeTokenAddress
    : null;
}

/**
 * The native gateway address, or `null` when no gateway is deployed on this chain.
 *
 * Distinct from the deprecated `Chain.nativeGateway`, which reports the zero
 * address rather than admitting absence.
 */
export function nativeGatewayAddress(chain: Chain): EvmAddress | null {
  return chain.nativeAsset?.__typename === 'WrappedNativeAsset'
    ? (chain.nativeAsset.gateway ?? null)
    : null;
}

/**
 * Whether this chain's native token is a distinct asset from its ERC20
 * representation — true wherever a wrapper exists (ETH and WETH are two
 * balances), false where the ERC20 is a view onto the native balance itself
 * (USDC on Arc is one balance seen two ways).
 *
 * The `false` case is why native and ERC20 amounts must never be summed on such
 * a chain: they are the same tokens counted twice.
 */
export function hasDistinctWrappedNative(chain: Chain): boolean {
  return chain.nativeAsset?.__typename === 'WrappedNativeAsset';
}
