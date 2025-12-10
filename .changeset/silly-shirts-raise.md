---
"@aave/graphql": minor
"@aave/client": minor
"@aave/react": minor
---

**BREAKING CHANGES:** support breaking changes from last batch of GQL changes

- **Breaking**
  - `FiatAmount` renamed to `ExchangeAmount` (all related types updated).
  - `updateUserDynamicConfig` removed.
  - `updateUserRiskPremium` replaced with `updateUserPositionConditions`.
  - `setUserSuppliesAsCollateral` renamed to plural form.

- **Features**
  - Expanded `ActivityFeedType` with new entries.
  - Added new items to the `ActivityItem` union.
  - Updated `AssetSummary` fragment and subfragments.
  - Added fields to `AssetSupplySample` and `AssetBorrowSample`.
  - Added new fields to `UserPosition`, including reworked risk premium via `UserPositionRiskPremium`.
  - `Chains` query now accepts a request object.
  - Added `isFork` field to `Chain`.
  - Added new field to `UserBalance`.
  - Added new fields to `ReserveSettings` and `ReserveUserState`.
  - `TokenInfo` now includes an `id` scalar and `categories`.

- **Fixes**
  - Corrected `utilizationRate` type in `HubSummary`.
