---
"@aave/core": patch
"@aave/client": patch
"@aave/react": patch
---

**fix:** coalesce same-key query operations onto in-flight network requests instead of issuing duplicates, in both the batched (`batchFetchExchange`) and non-batched (`inFlightDedupExchange` + `fetchExchange`) pipelines
