---
"@aave/react": patch
---

**fix:** hooks with a `pollInterval` keep polling when two components watch the same query; the second subscriber's stale replay stopped the timer after one round
