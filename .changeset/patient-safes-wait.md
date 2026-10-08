---
"@aave/types": minor
"@aave/core": minor
"@aave/client": minor
"@aave/react": minor
---

**feat:** track Smart Account transactions (e.g. Safe over WalletConnect, Safe mobile, Safe iframe) via `wallet_getCallsStatus` until they execute on-chain, resolving with the real execution hash; unexecuted ones fail after 30 minutes with `SubmissionUnresolvedError` (`name: 'TimeoutError'`, check `SubmissionUnresolvedError.is(error)` before assuming execution and do not resend blindly); `SendWithError` now includes `TimeoutError`; a dropped EOA tx now fails after 30 minutes with `SubmissionUnresolvedError` instead of 180s `UnexpectedError`; React Privy `useSendTransaction` and the CLI inherit the new tracking; removes the optional `@safe-global/safe-apps-sdk` peer dependency
