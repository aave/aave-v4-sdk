---
"@aave/client": minor
---

**feat:** add `display` config to `AaveClient.create()` for asset display transforms

Adds a `display` option to `ClientConfig` with two settings:

- `showWrappedNativeReserveAsNative` — when `true`, wrapped native tokens (e.g. WETH) are shown using the native asset's name, symbol, and icon (e.g. ETH) for protocol reserve queries. Detected via `HubAsset` presence in the response, so `userBalances`, rewards, and raw token swap queries are unaffected.
- `assetOverrides` — per-asset display overrides applied globally across all queries, keyed by `chainId` and `address`. Each entry takes a `display` object with optional `name`, `symbol`, and `icon` fields.

Both transforms are applied by a urql exchange before `graphcache`, so cached data already carries the transformed display info. The underlying `isWrappedNativeToken` flag and token `address` are preserved.
