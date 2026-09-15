---
"@aave/graphql": minor
"@aave/client": minor
"@aave/react": minor
---

**feat:** expose `Chain.nativeAsset`, return the richer `ChainDetails` from `chain`/`chains`, gate the wrapped-native display transform on chains that actually have a wrapped native asset, and add `collapseNativeErc20Balances` so a chain whose native token is itself an ERC20 is neither transformed nor counted twice
