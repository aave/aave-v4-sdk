---
"@aave/react": patch
---

fix: handle Merkl non-tracked claims in `useClaimRewards` and refresh `UserClaimableRewards` cache


Updated `useClaimRewards` to:
- Use `client.waitForTransaction(result)` only when `result.operations` is present
- Fallback to `okAsync(transactionReceipt(result.txHash))` when operations are missing (non-tracked claim flow)
- Refresh `UserClaimableRewardsQuery` cache via `andThrough(...)` in both paths
