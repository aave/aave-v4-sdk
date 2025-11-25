---
"@aave/client": patch
"@aave/react": patch
---

**fix:** emit `CancelError` from Ethers.js integrations and ensures to be on correct chain before sending tx.
