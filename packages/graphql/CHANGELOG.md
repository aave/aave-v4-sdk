# @aave/graphql

## 1.0.0-next.29

### Patch Changes

- a8716b1: **feat:** support `SwappableTokensRequestQuery.tokens`.

## 1.0.0-next.28

### Patch Changes

- e012b95: **feat:** supports `SwapOperation` and `ActivityItem` nodes changes.

## 1.0.0-next.27

### Patch Changes

- f4c8623: **fix:** correct typo `SpokePositionManger` to `SpokePositionManager` in GraphQL schema and cache
- 64b6596: **feat:** add `SwapOperation` union to `SwapStatus` entries. Support `InsufficientLiquidityError`. Add `orderClass` and `kind` to `SwapStatus` and ActivityItem` union entries.

## 1.0.0-next.26

### Patch Changes

- b65232e: **feat:** support USDT-like approval reset flow in React hooks.
- 05f1e7e: Add field canSwapFrom into ReserveFragment.
- Updated dependencies [b65232e]
  - @aave/types@1.0.0-next.8

## 1.0.0-next.25

### Minor Changes

- c3ae5d8: **feat:** add `selectedSlippage` field to `SwapQuote` fragment and `deadline` field to limit order input types

### Patch Changes

- 87e0889: **feat:** support `AssetSampleBreakdown`.

## 1.0.0-next.24

### Patch Changes

- 644ed9c: **chore:** removes deprecated `Erc20ApprovalRequired.transaction`.
- 3554361: **chore:** support new `PermiTypeData` GQL definition.

## 1.0.0-next.23

### Patch Changes

- 3e336b1: **chore:** rename `swapId` to `id` in swap activity types and `collateralUsed` to `supplyUsed` in `RepayWithSupplyActivity`

## 1.0.0-next.22

### Patch Changes

- b588966: **chore:** support latest activity types.

## 1.0.0-next.21

### Patch Changes

- c959acc: **fix:** removes `Erc20Token.permitSupported`

## 1.0.0-next.20

### Patch Changes

- 92c2d8f: **fix:** removes extra SwapTypedData fragment from query.

## 1.0.0-next.19

### Patch Changes

- 45e1145: **feat:** simplify supply and repay with ERC-20 permit signing hooks and helpers

## 1.0.0-next.18

### Patch Changes

- ec7fa5e: **fix:** update schema with `QuoteAccuracy` enum and `SwapQuote` field changes. Renamed `spotBuy`/`spotSell` to `buy`/`sell`, added `accuracy` field.

## 1.0.0-next.17

### Patch Changes

- ebb671f: **fix:** missing `UserPosition.netAccruedInterest`.
- dfafb5e: **fix:** pass `$currency` to `netAccruedInterest` fields.
- 2dd17d2: **fix:** removes duplicate HubAssetsRequestOrderBy export.
- 7b5995b: **fix:** updates `totalSupplyCap` and `totalBorrowCap` in `AssetSummary` to use `AssetAmountWithChange` type
- c40b2d4: **fix:** adds missing TS types for updated GQL input types.

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
