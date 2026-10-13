---
"@aave/types": minor
"@aave/core": minor
"@aave/client": minor
"@aave/react": minor
---

**feat:** wait for Smart Account transactions (e.g. Safe) to execute on-chain and return the real tx hash; transactions not on-chain after 30 minutes, including dropped EOA transactions that previously failed after 180s with `UnexpectedError`, now fail with `SubmissionUnresolvedError` (a `TimeoutError`, now part of `SendWithError`), so check `SubmissionUnresolvedError.is(error)` before resending; removes the optional `@safe-global/safe-apps-sdk` peer dependency
