---
"@aave/client": minor
---

**feat:** add `display` config to `AaveClient.create()` for asset display transforms

Adds a `display` option to `ClientConfig` with two settings:

- `showWrappedNativeReserveAsNative` — when `true`, wrapped native tokens (e.g. WETH) are shown using the native asset's name, symbol, and icon (e.g. ETH) within protocol reserve contexts (`Reserve`, `HubAsset`, `Asset`). Wallet balance, reward payout, and swap queries are unaffected.
- `assetOverrides` — per-asset display overrides applied globally across all queries, keyed by `chainId` and `address`. Each entry takes a `display` object with optional `name`, `symbol`, and `icon` fields. If both settings target the same token, `assetOverrides` takes precedence.

Transforms are applied by a urql exchange that runs after `graphcache` in the result pipeline — the cache always stores raw untransformed data. The underlying `isWrappedNativeToken` flag and token `address` are preserved.
