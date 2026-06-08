---
"@aave/client": patch
"@aave/react": patch
---

**fix:** pass resolved chain to `sendTransaction` to avoid stale `walletClient.chain` after `switchChain`
