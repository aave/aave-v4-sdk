import type {
  Chain,
  ChainDetails,
  TokenAmount,
  TokenInfo,
  UserBalance,
} from '@aave/graphql';
import { bigDecimal, type EvmAddress } from '@aave/types';

/**
 * The chain's native token — the asset gas is paid in.
 *
 * Returns `null` only for a chain with no native token at all, where gas is paid
 * in ordinary ERC20s. No such chain is supported today.
 */
export function nativeTokenInfo(chain: Chain): TokenInfo | null {
  // An explicit `null` is the schema saying this chain has no native token.
  // `nativeInfo` is non-nullable and still answers on such a chain, so falling
  // through to it would hand back a placeholder — with a zero `decimals` — in
  // place of the absence callers are checking for.
  if (chain.nativeAsset === null) return null;

  switch (chain.nativeAsset?.__typename) {
    case 'WrappedNativeAsset':
    case 'SharedBalanceNativeAsset':
      return chain.nativeAsset.nativeToken;
    default:
      // The field was not selected (a payload predating `nativeAsset`), or the
      // union gained a member this version predates. Both describe a chain that
      // does have a native token, so the deprecated field is still the answer.
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
 * The wrapped native token's own info, or `null` when this chain has no wrapper.
 *
 * Takes {@link ChainDetails} rather than {@link Chain}: the wrapper's `TokenInfo`
 * is selected only where a chain is fetched directly (`chain`, `chains`), not on
 * the chain embedded in every token. A `Chain` from a token simply does not
 * carry it.
 *
 * This is the replacement for the deprecated `Chain.nativeWrappedInfo`.
 */
export function wrappedNativeTokenInfo(chain: ChainDetails): TokenInfo | null {
  return chain.nativeAsset?.__typename === 'WrappedNativeAsset'
    ? chain.nativeAsset.wrappedNativeToken
    : null;
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

/**
 * Whether this balance is the ERC20 *view* of a native balance rather than a
 * balance of its own.
 *
 * On a chain whose native token is itself an ERC20, `userBalances` reports one
 * holding twice: a `NativeAmount` read from `eth_getBalance` at full precision,
 * and an `Erc20Amount` read from `balanceOf` at that ERC20's own, lower
 * precision. They are the same tokens counted two ways, so summing them reports
 * double. This identifies the second, redundant one.
 *
 * Returns `false` for ETH and WETH, which are two genuinely distinct balances
 * that *should* sum.
 */
export function isNativeErc20View(balance: TokenAmount): boolean {
  if (balance.__typename !== 'Erc20Amount') return false;

  const { nativeAsset } = balance.token.chain;
  if (nativeAsset?.__typename !== 'SharedBalanceNativeAsset') return false;

  return (
    balance.token.address.toLowerCase() ===
    nativeAsset.erc20Address.toLowerCase()
  );
}

/**
 * Drops every balance that is only the ERC20 view of a native balance, keeping
 * the full-precision native row. Use this before summing or rendering the
 * balances of a single {@link UserBalance}.
 *
 * Returns the original array when there is nothing to drop, so a consumer can
 * rely on reference equality to skip re-renders.
 */
export function withoutNativeErc20Views(
  balances: readonly TokenAmount[],
): readonly TokenAmount[] {
  const kept = balances.filter((balance) => !isNativeErc20View(balance));
  return kept.length === balances.length ? balances : kept;
}

/**
 * Removes the duplicate ERC20 views of native balances across a `userBalances`
 * result, so the totals can be summed without double-counting.
 *
 * A `UserBalance` left with no balances is dropped. One that keeps some but not
 * all of its rows has `totalAmount` and `exchange` recomputed from the rows that
 * survived — every row inside a single entry shares the entry's decimals, so the
 * on-chain values sum exactly rather than being re-derived from a decimal value.
 *
 * Entries that lose nothing are passed through by reference.
 */
export function collapseNativeErc20Balances(
  userBalances: readonly UserBalance[],
): UserBalance[] {
  const result: UserBalance[] = [];

  for (const entry of userBalances) {
    const kept = withoutNativeErc20Views(entry.balances);

    if (kept.length === entry.balances.length) {
      result.push(entry);
      continue;
    }

    // Everything this entry described was a duplicate view of a native balance
    // reported under its own entry.
    if (kept.length === 0) continue;

    result.push({
      ...entry,
      balances: kept as UserBalance['balances'],
      totalAmount: {
        ...entry.totalAmount,
        value: kept.reduce(
          (total, balance) => total.add(balance.amount.value),
          bigDecimal(0),
        ),
        onChainValue: kept.reduce(
          (total, balance) => total + balance.amount.onChainValue,
          0n,
        ),
      },
      exchange: {
        ...entry.exchange,
        value: kept.reduce(
          (total, balance) => total.add(balance.exchange.value),
          bigDecimal(0),
        ),
      },
    });
  }

  return result;
}
