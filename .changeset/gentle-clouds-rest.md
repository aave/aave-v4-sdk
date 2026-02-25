---
"@aave/react": patch
---

**fix:** add unmounted component guard in `useAsyncTask` to prevent undefined state errors, applies to all imperative hooks (e.g. `useSupply`, `useBorrow`, `useRepay`, `useWithdraw`)
