---
"@aave/client": patch
"@aave/react": patch
---

**fix:** send transactions via EIP-5792 `wallet_sendCalls` when the wallet reports atomic support (fixes Safe over WalletConnect); `SendWithError` now includes `TimeoutError`
