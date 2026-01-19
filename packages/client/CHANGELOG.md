# @aave/client

## 4.0.0-next.21

### Patch Changes

- 531b1f6: **feat:** dual-request strategy for `useTokenSwapQuote` with Fast and Accurate quotes
- Updated dependencies [531b1f6]
  - @aave/core@1.0.0-next.11

## 4.0.0-next.20

### Patch Changes

- ec7fa5e: **fix:** update schema with `QuoteAccuracy` enum and `SwapQuote` field changes. Renamed `spotBuy`/`spotSell` to `buy`/`sell`, added `accuracy` field.
- Updated dependencies [ec7fa5e]
  - @aave/graphql@1.0.0-next.18

## 4.0.0-next.19

### Patch Changes

- ebb671f: **fix:** missing `UserPosition.netAccruedInterest`.
- dfafb5e: **fix:** pass `$currency` to `netAccruedInterest` fields.
- 2dd17d2: **fix:** removes duplicate HubAssetsRequestOrderBy export.
- c40b2d4: **fix:** adds missing TS types for updated GQL input types.
- Updated dependencies [ebb671f]
- Updated dependencies [dfafb5e]
- Updated dependencies [2dd17d2]
- Updated dependencies [7b5995b]
- Updated dependencies [c40b2d4]
  - @aave/graphql@1.0.0-next.17

## 4.0.0-next.18

### Patch Changes

- 7ac6dd9: **chore:** updates to recentl schema changes.
- caf0bf3: **chore:** support recent swap related GQL changes.
- daf3b0f: **chore:** support latest schema and better error handling.
- cdab8e1: **fix:** error handling of unknown GQL typenames.
- Updated dependencies [7ac6dd9]
- Updated dependencies [caf0bf3]
- Updated dependencies [daf3b0f]
- Updated dependencies [cdab8e1]
  - @aave/graphql@1.0.0-next.16
  - @aave/types@1.0.0-next.7
  - @aave/core@1.0.0-next.10

## 4.0.0-next.17

### Patch Changes

- d5ba506: **chore:** support most recent GQL schema.
- Updated dependencies [d5ba506]
  - @aave/graphql@1.0.0-next.15

## 4.0.0-next.16

### Patch Changes

- f31d016: **fix:** issue with decodeUserPositionId`.
- Updated dependencies [f31d016]
  - @aave/graphql@1.0.0-next.14

## 4.0.0-next.15

### Patch Changes

- 402281c: **feat:** expose tx hash from `TransactionError`.
- Updated dependencies [402281c]
  - @aave/core@1.0.0-next.9

## 4.0.0-next.14

### Patch Changes

- 40a234e: **feat:** support latest swap GQL changes.
- Updated dependencies [40a234e]
  - @aave/graphql@1.0.0-next.13

## 4.0.0-next.13

### Patch Changes

- Updated dependencies [93adceb]
  - @aave/graphql@1.0.0-next.12

## 4.0.0-next.12

### Patch Changes

- 1b7736a: **fix:** removes `period` argument from `PreviewUserPosition.projectedEarnings` field.
- 5fad9a6: **feat:** `preparePositionSwap` and `supplySwapQuote` actions.
- 3eb2d1a: **feat:** support changes to `SwapStatus` union.
- 6c71713: **feat:** allows to expand swap strategies without breaking changes.
- b06776a: **feat:** `withdrawSwapQuote` action, `useWithdrawSwapQuote` and `useWithdrawSwap` hooks.
- 1931215: **feat:** `repayWithSupplyQuote` action, `useRepayWithSupplyQuote` and `useRepayWithSupply` hooks.
- 551c14c: **feat:** `borrowSwapQuote` action and `useBorrowSwap` hook.
- Updated dependencies [1b7736a]
- Updated dependencies [5fad9a6]
- Updated dependencies [3eb2d1a]
- Updated dependencies [6c71713]
- Updated dependencies [b06776a]
- Updated dependencies [5fad9a6]
- Updated dependencies [1931215]
- Updated dependencies [5fad9a6]
- Updated dependencies [551c14c]
- Updated dependencies [4c076bd]
  - @aave/graphql@1.0.0-next.11
  - @aave/types@1.0.0-next.6
  - @aave/core@1.0.0-next.8

## 4.0.0-next.11

### Patch Changes

- 7920b63: **chore:** removes deprecated `ProtocolHistorySample.earnings` field.
- 312863d: **chore:** removes support for `assetCategoryBorrowHistory` and `assetCategorySupplyHistory`.
- Updated dependencies [7920b63]
- Updated dependencies [312863d]
  - @aave/graphql@1.0.0-next.10

## 4.0.0-next.10

### Patch Changes

- 0966b94: **fix:** issue with GQL errors suchas Bad User Input or Bad Request blocking indefintely transaction hooks.
- 1a2afe7: **chore:** adjusts `UpdateUserPositionConditionsRequest` to latest GQL schema.
- 9765eea: **chore:** support latest minor GQL changes.
- Updated dependencies [0966b94]
- Updated dependencies [1a2afe7]
- Updated dependencies [9765eea]
  - @aave/core@1.0.0-next.7
  - @aave/graphql@1.0.0-next.9

## 4.0.0-next.9

### Patch Changes

- f5950a3: **feat:** updates PreviewUserPosition fragment.
- 453e6da: **fix:** export missing types and adjust GQL schema.
- Updated dependencies [2f31f53]
- Updated dependencies [f5950a3]
- Updated dependencies [453e6da]
  - @aave/types@1.0.0-next.5
  - @aave/graphql@1.0.0-next.8
  - @aave/core@1.0.0-next.6

## 4.0.0-next.8

### Minor Changes

- c3c34a1: **feat:** support for `protocolHistory` query.

### Patch Changes

- 0704c75: **chore:** updates APY > Apy renaming and other changes.
- Updated dependencies [0704c75]
- Updated dependencies [c3c34a1]
  - @aave/graphql@1.0.0-next.7

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
- Updated dependencies [f651671]
- Updated dependencies [1f2bcb8]
  - @aave/graphql@1.0.0-next.6
  - @aave/types@1.0.0-next.4
  - @aave/core@1.0.0-next.5

## 4.0.0-next.6

## 4.0.0-next.5

### Minor Changes

- fe65fe9: **feat:** viem integration to leverage API as source of truth about chain details.

### Patch Changes

- e903ab5: **chore:** removes batching by aliases in favour of batching GQL-over-HTTP.
- Updated dependencies [fe65fe9]
- Updated dependencies [e903ab5]
  - @aave/graphql@1.0.0-next.5
  - @aave/core@1.0.0-next.4

## 4.0.0-next.4

### Minor Changes

- be462e6: **feat:** smart baching of GQL queries.

### Patch Changes

- 009995d: **feat:** expose hubId filters for user balances and reserves.
- 79bef0a: **fix:** remove client-side sorting for activities to preserve backend ordering.
- 464b6f2: **fix:** thirdweb integration to support chains based on tenderly forks.
- de80d52: **fix:** emit `CancelError` from Ethers.js integrations and ensures to be on correct chain before sending tx.
- Updated dependencies [009995d]
- Updated dependencies [be462e6]
- Updated dependencies [de80d52]
  - @aave/graphql@1.0.0-next.4
  - @aave/core@1.0.0-next.3
  - @aave/types@1.0.0-next.3

## 4.0.0-next.3

### Patch Changes

- 39649f8: **fix:** `BigDecimal#toDisplayString(n)` behaviour with `minFractionDigits` (see test).
- Updated dependencies [39649f8]
  - @aave/types@1.0.0-next.2
  - @aave/core@1.0.0-next.2
  - @aave/graphql@1.0.0-next.3

## 4.0.0-next.2

### Patch Changes

- 7ed8ac6: **fix:** rebuild from local
- Updated dependencies [7ed8ac6]
  - @aave/core@1.0.0-next.1
  - @aave/graphql@1.0.0-next.2
  - @aave/types@1.0.0-next.1

## 4.0.0-next.1

### Patch Changes

- 9aa3438: **fix:** updates `DecimalNumeberWithChange#change` to be `PercentNumber` and not `DecimalNumber`
- Updated dependencies [9aa3438]
  - @aave/graphql@1.0.0-next.1

## 4.0.0-next.0

### Major Changes

- 7789c8e: **feat:** new AaveKit v4.

### Patch Changes

- Updated dependencies [7789c8e]
  - @aave/graphql@1.0.0-next.0
  - @aave/types@1.0.0-next.0
  - @aave/core@1.0.0-next.0
