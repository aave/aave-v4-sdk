---
"@aave/core": patch
"@aave/client": patch
"@aave/react": patch
---

**fix:** `network-only` queries resolve with the network response instead of a graphcache re-read of the same key, which also aborted the request
