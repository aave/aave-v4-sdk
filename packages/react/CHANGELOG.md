# @aave/react

## 4.0.0-next.8

### Minor Changes

- c3c34a1: **feat:** support for `protocolHistory` query.

### Patch Changes

- 0704c75: **chore:** updates APY > Apy renaming and other changes.
- Updated dependencies [0704c75]
- Updated dependencies [c3c34a1]
  - @aave/graphql@1.0.0-next.7
  - @aave/client@4.0.0-next.8

## 4.0.0-next.7

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

- 28dd334: **fix:** amends thirdweb integrations to leverage chain details from API whenever possible
- f651671: **chore:** adds patterns to avoid breaking changes on expanding enum and GQL unions.
- Updated dependencies [28dd334]
- Updated dependencies [f651671]
- Updated dependencies [1f2bcb8]
  - @aave/client@4.0.0-next.7
  - @aave/graphql@1.0.0-next.6
  - @aave/types@1.0.0-next.4
  - @aave/core@1.0.0-next.5

## 4.0.0-next.6

### Patch Changes

- 7fbec95: **chore:** re-export viemChainsFrom helper from @aave/react/viem entrypoint.
  - @aave/client@4.0.0-next.6

## 4.0.0-next.5

### Minor Changes

- fe65fe9: **feat:** viem integration to leverage API as source of truth about chain details.

### Patch Changes

- e903ab5: **chore:** removes batching by aliases in favour of batching GQL-over-HTTP.
- Updated dependencies [fe65fe9]
- Updated dependencies [e903ab5]
  - @aave/graphql@1.0.0-next.5
  - @aave/client@4.0.0-next.5
  - @aave/core@1.0.0-next.4

## 4.0.0-next.4

### Minor Changes

- be462e6: **feat:** smart baching of GQL queries.

### Patch Changes

- 009995d: **feat:** expose hubId filters for user balances and reserves.
- 464b6f2: **fix:** thirdweb integration to support chains based on tenderly forks.
- de80d52: **fix:** emit `CancelError` from Ethers.js integrations and ensures to be on correct chain before sending tx.
- Updated dependencies [009995d]
- Updated dependencies [be462e6]
- Updated dependencies [de80d52]
- Updated dependencies [79bef0a]
- Updated dependencies [464b6f2]
- Updated dependencies [de80d52]
  - @aave/graphql@1.0.0-next.4
  - @aave/client@4.0.0-next.4
  - @aave/core@1.0.0-next.3
  - @aave/types@1.0.0-next.3

## 4.0.0-next.3

### Patch Changes

- 39649f8: **fix:** `BigDecimal#toDisplayString(n)` behaviour with `minFractionDigits` (see test).
- Updated dependencies [39649f8]
  - @aave/types@1.0.0-next.2
  - @aave/client@4.0.0-next.3
  - @aave/core@1.0.0-next.2
  - @aave/graphql@1.0.0-next.3

## 4.0.0-next.2

### Patch Changes

- 7ed8ac6: **fix:** rebuild from local
- Updated dependencies [7ed8ac6]
  - @aave/client@4.0.0-next.2
  - @aave/core@1.0.0-next.1
  - @aave/graphql@1.0.0-next.2
  - @aave/types@1.0.0-next.1

## 4.0.0-next.1

### Patch Changes

- 9aa3438: **fix:** updates `DecimalNumeberWithChange#change` to be `PercentNumber` and not `DecimalNumber`
- Updated dependencies [9aa3438]
  - @aave/graphql@1.0.0-next.1
  - @aave/client@4.0.0-next.1

## 4.0.0-next.0

### Major Changes

- 7789c8e: **feat:** new AaveKit v4.

### Patch Changes

- Updated dependencies [7789c8e]
  - @aave/graphql@1.0.0-next.0
  - @aave/client@4.0.0-next.0
  - @aave/types@1.0.0-next.0
  - @aave/core@1.0.0-next.0
