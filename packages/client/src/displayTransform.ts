import type { AssetOverride } from './config';

export type Erc20TokenShape = {
  __typename: 'Erc20Token';
  info: Record<string, unknown>;
  address: string;
  chain: { chainId: number; nativeInfo: Record<string, unknown> };
  isWrappedNativeToken: boolean;
};

export function isErc20Token(value: unknown): value is Erc20TokenShape {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (value as Record<string, unknown>).__typename === 'Erc20Token';
}

export function shouldApplyWrappedNativeTransform(
  showWrappedNativeReserveAsNative: boolean,
  data: unknown,
): boolean {
  // We only want to apply the wrapped native transform on queries for protocol assets and/or reserves.
  // Wallet balance and swap queries should not be affected.
  return (
    showWrappedNativeReserveAsNative &&
    (containsTypename(data, 'HubAsset') || containsTypename(data, 'Asset'))
  );
}

export function containsTypename(data: unknown, typename: string): boolean {
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data))
    return data.some((item) => containsTypename(item, typename));
  const obj = data as Record<string, unknown>;
  if (obj.__typename === typename) return true;
  return Object.values(obj).some((v) => containsTypename(v, typename));
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
): unknown {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    let changed = false;
    const result = data.map((item) => {
      const transformed = deepTransformTokens(
        item,
        applyWrappedNative,
        overrideMap,
      );
      if (transformed !== item) changed = true;
      return transformed;
    });
    return changed ? result : data;
  }

  if (isErc20Token(data)) {
    return transformErc20Token(data, applyWrappedNative, overrideMap);
  }

  const obj = data as Record<string, unknown>;
  let changed = false;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const transformed = deepTransformTokens(v, applyWrappedNative, overrideMap);
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
      info: { ...token.chain.nativeInfo, id: token.info.id },
    };
  }

  if (overrideMap) {
    const key = `${token.chain.chainId}:${token.address.toLowerCase()}`;
    const override = overrideMap.get(key);
    if (override) {
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
