# @aave/graphql

## 1.0.0-next.16

### Patch Changes

- 7ac6dd9: **chore:** updates to recentl schema changes.
- caf0bf3: **chore:** support recent swap related GQL changes.
- daf3b0f: **chore:** support latest schema and better error handling.
- cdab8e1: **fix:** error handling of unknown GQL typenames.
- Updated dependencies [caf0bf3]
- Updated dependencies [daf3b0f]
- Updated dependencies [cdab8e1]
  - @aave/types@1.0.0-next.7

## 1.0.0-next.15

### Patch Changes

- d5ba506: **chore:** support most recent GQL schema.

## 1.0.0-next.14

### Patch Changes

- f31d016: **fix:** issue with decodeUserPositionId`.

## 1.0.0-next.13

### Patch Changes

- 40a234e: **feat:** support latest swap GQL changes.

## 1.0.0-next.12

### Patch Changes

- 93adceb: **fix:** `useTokenSwap` and `useCancelSwap` hooks.

## 1.0.0-next.11

### Patch Changes

- 1b7736a: **fix:** removes `period` argument from `PreviewUserPosition.projectedEarnings` field.
- 5fad9a6: **feat:** `preparePositionSwap` and `supplySwapQuote` actions.
- 3eb2d1a: **feat:** support changes to `SwapStatus` union.
- 6c71713: **feat:** allows to expand swap strategies without breaking changes.
- b06776a: **feat:** `withdrawSwapQuote` action, `useWithdrawSwapQuote` and `useWithdrawSwap` hooks.
- 5fad9a6: **feat:** `useSupplySwap` and `useSupplySwapQuote` hooks.
- 1931215: **feat:** `repayWithSupplyQuote` action, `useRepayWithSupplyQuote` and `useRepayWithSupply` hooks.
- 5fad9a6: **feat:** support latest GQL schema.
- 551c14c: **feat:** `borrowSwapQuote` action and `useBorrowSwap` hook.
- 4c076bd: **feat:** new `useBorrowSwapQuote` hook.
- Updated dependencies [5fad9a6]
- Updated dependencies [5fad9a6]
- Updated dependencies [5fad9a6]
  - @aave/types@1.0.0-next.6

## 1.0.0-next.10

### Patch Changes

- 7920b63: **chore:** removes deprecated `ProtocolHistorySample.earnings` field.
- 312863d: **chore:** removes support for `assetCategoryBorrowHistory` and `assetCategorySupplyHistory`.

## 1.0.0-next.9

### Patch Changes

- 1a2afe7: **chore:** adjusts `UpdateUserPositionConditionsRequest` to latest GQL schema.
- 9765eea: **chore:** support latest minor GQL changes.

## 1.0.0-next.8

### Patch Changes

- f5950a3: **feat:** updates PreviewUserPosition fragment.
- 453e6da: **fix:** export missing types and adjust GQL schema.
- Updated dependencies [2f31f53]
  - @aave/types@1.0.0-next.5

## 1.0.0-next.7

### Minor Changes

- c3c34a1: **feat:** support for `protocolHistory` query.

### Patch Changes

- 0704c75: **chore:** updates APY > Apy renaming and other changes.

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
