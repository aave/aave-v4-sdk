---
"@aave/client": patch
---

**fix:** Scope the urql graphcache key for `Erc20Token` by chain. The previous key used only `address`, which collapsed the same token contract across chains (e.g. the same ERC-20 on a mainnet and on a Tenderly fork) into a single cache entry — the embedded `chain` field was overwritten on each write, so any read through `Erc20Token.chain` (such as `Reserve.asset.underlying.chain`) returned the wrong chain. The key is now `${chain.chainId}:${address}`.
