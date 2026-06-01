import type { AssetOverride } from './config';

export type Erc20TokenShape = {
  __typename: 'Erc20Token';
  info: Record<string, unknown>;
  address: string;
  chain: { chainId: number; nativeInfo: Record<string, unknown> };
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

export function transformErc20Token(
  token: Erc20TokenShape,
  applyWrappedNative: boolean,
  overrideMap: Map<string, AssetOverride> | null,
): Erc20TokenShape {
  let current = token;

  if (applyWrappedNative && token.isWrappedNativeToken) {
    current = {
      ...current,
      // Preserve the original info.id so consumer-facing token identity is stable
      // across the native transform (e.g. React keys, downstream identity checks).
      info: { ...token.chain.nativeInfo, id: token.info.id },
    };
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
