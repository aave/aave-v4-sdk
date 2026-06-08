---
"@aave/client": patch
"@aave/react": patch
---

**fix:** re-create viem wallet client with correct chain after switching in `useSendTransaction` to prevent stale chain reference errors
