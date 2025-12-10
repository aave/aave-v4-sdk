# @aave/graphql

## 1.0.0-next.6

### Minor Changes

- 1f2bcb8: **BREAKING CHANGES:** support breaking changes from last batch of GQL changes

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

### Patch Changes

- f651671: **chore:** adds patterns to avoid breaking changes on expanding enum and GQL unions.
- Updated dependencies [f651671]
  - @aave/types@1.0.0-next.4

## 1.0.0-next.5

### Minor Changes

- fe65fe9: **feat:** viem integration to leverage API as source of truth about chain details.

## 1.0.0-next.4

### Patch Changes

- 009995d: **feat:** expose hubId filters for user balances and reserves.
- Updated dependencies [de80d52]
  - @aave/types@1.0.0-next.3

## 1.0.0-next.3

### Patch Changes

- Updated dependencies [39649f8]
  - @aave/types@1.0.0-next.2

## 1.0.0-next.2

### Patch Changes

- 7ed8ac6: **fix:** rebuild from local
- Updated dependencies [7ed8ac6]
  - @aave/types@1.0.0-next.1

## 1.0.0-next.1

### Patch Changes

- 9aa3438: **fix:** updates `DecimalNumeberWithChange#change` to be `PercentNumber` and not `DecimalNumber`

## 1.0.0-next.0

### Major Changes

- 7789c8e: **feat:** new AaveKit v4.

### Patch Changes

- Updated dependencies [7789c8e]
  - @aave/types@1.0.0-next.0
