import type { AssetOverride } from './config';

/**
 * A `Chain.nativeAsset` union member as it arrives on the wire. Loosely typed
 * because this transform walks raw response data, not fragment types.
 */
export type NativeAssetShape = {
  __typename?: string;
  nativeToken?: Record<string, unknown>;
};

export type Erc20TokenShape = {
  __typename: 'Erc20Token';
  info: Record<string, unknown>;
  address: string;
  chain: {
    chainId: number;
    /** Absent on a payload that predates `nativeAsset`; `null` on a chain with no native token. */
    nativeAsset?: NativeAssetShape | null;
    /** Superseded by `nativeAsset`; still read as a fallback for older payloads. */
    nativeInfo?: Record<string, unknown>;
  };
  isWrappedNativeToken: boolean;
};

// Typenames that represent protocol reserve contexts — wrapped-native transform applies to
// Erc20Token descendants of these nodes.
const WRAPPED_NATIVE_TRANSFORM_ALLOWLIST = new Set([
  'Reserve',
  'HubAsset',
  'Asset',
  'HubSpokeConfig',
  'CollateralFactorVariation',
  'LiquidationFeeVariation',
  'MaxLiquidationBonusVariation',
  'BorrowActivity',
  'SupplyActivity',
  'RepayActivity',
  'WithdrawActivity',
  'LiquidatedActivity',
  'PositionAmount',
]);

// Typenames whose Erc20Token descendants should NOT be transformed even when nested inside
// a reserve node — covers user wallet balances and reward payout tokens.
const WRAPPED_NATIVE_TRANSFORM_BLOCKLIST = new Set([
  'ReserveUserState',
  'HubAssetUserState',
  'MerklSupplyReward',
  'MerklBorrowReward',
  'PreviewMerklSupplyReward',
  'PreviewMerklBorrowReward',
]);

export function isErc20Token(value: unknown): value is Erc20TokenShape {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (value as Record<string, unknown>).__typename === 'Erc20Token';
}

export function buildAssetOverrideMap(
  overrides: AssetOverride[],
): Map<string, AssetOverride> {
  return new Map(
    overrides.map((o) => [`${o.chainId}:${o.address.toLowerCase()}`, o]),
  );
}

export function deepTransformTokens(
  data: unknown,
  applyWrappedNative: boolean,
  overrideMap: Map<string, AssetOverride> | null,
  withinReserve = false,
): unknown {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    let changed = false;
    const result = data.map((item) => {
      const transformed = deepTransformTokens(
        item,
        applyWrappedNative,
        overrideMap,
        withinReserve,
      );
      if (transformed !== item) changed = true;
      return transformed;
    });
    return changed ? result : data;
  }

  if (isErc20Token(data)) {
    return transformErc20Token(
      data,
      applyWrappedNative && withinReserve,
      overrideMap,
    );
  }

  const obj = data as Record<string, unknown>;
  const typename = obj.__typename as string | undefined;

  let nextWithinReserve = withinReserve;
  if (typename) {
    if (WRAPPED_NATIVE_TRANSFORM_ALLOWLIST.has(typename))
      nextWithinReserve = true;
    if (WRAPPED_NATIVE_TRANSFORM_BLOCKLIST.has(typename))
      nextWithinReserve = false;
  }

  let changed = false;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const transformed = deepTransformTokens(
      v,
      applyWrappedNative,
      overrideMap,
      nextWithinReserve,
    );
    if (transformed !== v) changed = true;
    result[k] = transformed;
  }
  return changed ? result : data;
}

/**
 * The native token info this ERC20 may be displayed as, or `null` when the
 * substitution is not licensed on this chain.
 *
 * Only a real wrapper licenses it. On a shared-balance chain the ERC20 *is* the
 * native token viewed at its own, lower precision — substituting there would
 * dress a 6-decimal asset in 18-decimal info.
 */
function wrappedNativeDisplayInfo(
  chain: Erc20TokenShape['chain'],
): Record<string, unknown> | null {
  // `undefined` means the payload predates `nativeAsset`; `null` means the chain
  // genuinely has no native token to borrow from.
  if (chain.nativeAsset === undefined) return chain.nativeInfo ?? null;
  if (chain.nativeAsset === null) return null;

  return chain.nativeAsset.__typename === 'WrappedNativeAsset'
    ? (chain.nativeAsset.nativeToken ?? null)
    : null;
}

export function transformErc20Token(
  token: Erc20TokenShape,
  applyWrappedNative: boolean,
  overrideMap: Map<string, AssetOverride> | null,
): Erc20TokenShape {
  let current = token;

  if (applyWrappedNative && token.isWrappedNativeToken) {
    const nativeInfo = wrappedNativeDisplayInfo(token.chain);
    if (nativeInfo) {
      current = {
        ...current,
        info: {
          ...nativeInfo,
          // Preserve the original info.id so consumer-facing token identity is stable
          // across the native transform (e.g. React keys, downstream identity checks).
          id: token.info.id,
          // Keep the ERC20's own scale. A wrapper's decimals always equal its
          // native token's, so this is a no-op today — it exists so the transform
          // can never rescale an amount, whatever the backend sends.
          decimals: token.info.decimals,
        },
      };
    }
  }

  if (overrideMap) {
    const key = `${token.chain.chainId}:${token.address.toLowerCase()}`;
    const override = overrideMap.get(key);
    if (override?.display) {
      const { name, symbol, icon } = override.display;
      const patch: Record<string, string> = {};
      if (name !== undefined) patch.name = name;
      if (symbol !== undefined) patch.symbol = symbol;
      if (icon !== undefined) patch.icon = icon;
      current = { ...current, info: { ...current.info, ...patch } };
    }
  }

  return current;
}
