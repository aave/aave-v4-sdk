---
"@aave/react": patch
---

**fix:** `useSignTypedData` (viem adapter) now switches the wallet to the typed data's `domain.chainId` before signing, preventing `Provided chainId must match the active chainId` errors
