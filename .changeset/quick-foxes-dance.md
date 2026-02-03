---
"@aave/core": patch
"@aave/client": patch
"@aave/react": patch
---

**fix:** extends cache refresh mechanism to account for past queries that left a presence in the cache but are no longer watched.
