---
"@aave/graphql": patch
"@aave/client": patch
"@aave/react": patch
---

**fix:** update schema adding required `chainId` and `user` fields to `ClaimRewardsRequest` and `UserClaimableRewardsRequest`, remove deprecated `borrowCap` and `supplyCap` from `Reserve`
