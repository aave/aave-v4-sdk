# @aave/react

## 4.0.0-next.30

### Minor Changes

- c3ae5d8: **feat:** add `selectedSlippage` field to `SwapQuote` fragment and `deadline` field to limit order input types

### Patch Changes

- 3a9cc5f: **fix:** ensure cache updates after transactions for cache-first hooks
- 9fa182b: **feat:** imperative read hooks now default to `cache-first` request policy
- 87e0889: **feat:** support `AssetSampleBreakdown`.
- ce7a7c9: **fix:** removes unnecessary TS assertions.
- Updated dependencies [3a9cc5f]
- Updated dependencies [9fa182b]
- Updated dependencies [c3ae5d8]
- Updated dependencies [87e0889]
  - @aave/client@4.0.0-next.30
  - @aave/graphql@1.0.0-next.25

## 4.0.0-next.29

### Patch Changes

- 644ed9c: **chore:** removes deprecated `Erc20ApprovalRequired.transaction`.
- a96356a: **fix:** cast `PermitTypedData.message.deadline` to `number` to align with `ERC20PermitSignature` input type after GraphQL schema update
- 83c0dc7: **fix:** add missing URQL cache configuration for swap activity types and date transformers
- 3554361: **chore:** support new `PermiTypeData` GQL definition.
- 2bbf48f: **fix:** remove `supportedChains` dependency from Privy transaction receipt handling
- Updated dependencies [644ed9c]
- Updated dependencies [a96356a]
- Updated dependencies [83c0dc7]
- Updated dependencies [3554361]
- Updated dependencies [2bbf48f]
  - @aave/graphql@1.0.0-next.24
  - @aave/client@4.0.0-next.29

## 4.0.0-next.28

### Patch Changes

- 65b96f7: **fix:** wait for approval transactions before executing main transaction in `useSupply` and `useRepay` hooks
- Updated dependencies [65b96f7]
  - @aave/client@4.0.0-next.28

## 4.0.0-next.27

### Patch Changes

- 3e336b1: **chore:** rename `swapId` to `id` in swap activity types and `collateralUsed` to `supplyUsed` in `RepayWithSupplyActivity`
- Updated dependencies [3e336b1]
  - @aave/graphql@1.0.0-next.23
  - @aave/client@4.0.0-next.27

## 4.0.0-next.26

### Patch Changes

- b588966: **chore:** support latest activity types.
- Updated dependencies [b588966]
  - @aave/graphql@1.0.0-next.22
  - @aave/client@4.0.0-next.26

## 4.0.0-next.25

### Patch Changes

- c959acc: **fix:** removes `Erc20Token.permitSupported`
- Updated dependencies [c959acc]
  - @aave/graphql@1.0.0-next.21
  - @aave/client@4.0.0-next.25

## 4.0.0-next.24

### Patch Changes

- 92c2d8f: **fix:** removes extra SwapTypedData fragment from query.
- Updated dependencies [92c2d8f]
  - @aave/graphql@1.0.0-next.20
  - @aave/client@4.0.0-next.24

## 4.0.0-next.23

### Minor Changes

- 7ddec84: **feat:** implement `useSwapStatus` hook and makes `useUserSwaps` poll for status updates until terminal state.

### Patch Changes

- Updated dependencies [5a52991]
- Updated dependencies [7ddec84]
  - @aave/client@4.0.0-next.23
  - @aave/core@1.0.0-next.12

## 4.0.0-next.22

### Patch Changes

- 45e1145: **feat:** simplify supply and repay with ERC-20 permit signing hooks and helpers
- Updated dependencies [45e1145]
  - @aave/graphql@1.0.0-next.19
  - @aave/client@4.0.0-next.22

## 4.0.0-next.21

### Patch Changes

- 531b1f6: **feat:** dual-request strategy for `useTokenSwapQuote` with Fast and Accurate quotes
- Updated dependencies [531b1f6]
  - @aave/core@1.0.0-next.11
  - @aave/client@4.0.0-next.21

## 4.0.0-next.20

### Patch Changes

- ec7fa5e: **fix:** update schema with `QuoteAccuracy` enum and `SwapQuote` field changes. Renamed `spotBuy`/`spotSell` to `buy`/`sell`, added `accuracy` field.
- Updated dependencies [ec7fa5e]
  - @aave/graphql@1.0.0-next.18
  - @aave/client@4.0.0-next.20

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
  - @aave/client@4.0.0-next.19

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
  - @aave/client@4.0.0-next.18
  - @aave/types@1.0.0-next.7
  - @aave/core@1.0.0-next.10

## 4.0.0-next.17

### Patch Changes

- d5ba506: **chore:** support most recent GQL schema.
- fffac6d: **feat:** implements `useSupplySwapQuoteAction`, `useBorrowSwapQuoteAction`, `useRepayWithSupplyQuoteAction`, `useWithdrawSwapQuoteAction` hooks.
- Updated dependencies [d5ba506]
  - @aave/graphql@1.0.0-next.15
  - @aave/client@4.0.0-next.17

## 4.0.0-next.16

### Patch Changes

- f31d016: **fix:** issue with decodeUserPositionId`.
- Updated dependencies [f31d016]
  - @aave/client@4.0.0-next.16
  - @aave/graphql@1.0.0-next.14

## 4.0.0-next.15

### Patch Changes

- 402281c: **feat:** expose tx hash from `TransactionError`.
- 990608b: **feat:** support network fee estimation for `updateUserPositionConditions` preview action.
- 41d5e4d: **fix:** renames `useSignSwapTypedDataWith` into `useSignSwapTypedData`.
- Updated dependencies [402281c]
  - @aave/core@1.0.0-next.9
  - @aave/client@4.0.0-next.15

## 4.0.0-next.14

### Patch Changes

- 40a234e: **feat:** support latest swap GQL changes.
- Updated dependencies [40a234e]
  - @aave/graphql@1.0.0-next.13
  - @aave/client@4.0.0-next.14

## 4.0.0-next.13

### Patch Changes

- 93adceb: **fix:** `useTokenSwap` and `useCancelSwap` hooks.
- Updated dependencies [93adceb]
  - @aave/graphql@1.0.0-next.12
  - @aave/client@4.0.0-next.13

## 4.0.0-next.12

### Patch Changes

- 1b7736a: **fix:** removes `period` argument from `PreviewUserPosition.projectedEarnings` field.
- 3eb2d1a: **feat:** support changes to `SwapStatus` union.
- 6c71713: **feat:** allows to expand swap strategies without breaking changes.
- b06776a: **feat:** `withdrawSwapQuote` action, `useWithdrawSwapQuote` and `useWithdrawSwap` hooks.
- 5fad9a6: **feat:** `useSupplySwap` and `useSupplySwapQuote` hooks.
- 1931215: **feat:** `repayWithSupplyQuote` action, `useRepayWithSupplyQuote` and `useRepayWithSupply` hooks.
- 551c14c: **feat:** `borrowSwapQuote` action and `useBorrowSwap` hook.
- 4c076bd: **feat:** new `useBorrowSwapQuote` hook.
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
  - @aave/client@4.0.0-next.12
  - @aave/types@1.0.0-next.6
  - @aave/core@1.0.0-next.8

## 4.0.0-next.11

### Patch Changes

- 7920b63: **chore:** removes deprecated `ProtocolHistorySample.earnings` field.
- 312863d: **chore:** removes support for `assetCategoryBorrowHistory` and `assetCategorySupplyHistory`.
- Updated dependencies [7920b63]
- Updated dependencies [312863d]
  - @aave/graphql@1.0.0-next.10
  - @aave/client@4.0.0-next.11

## 4.0.0-next.10

### Patch Changes

- 0966b94: **fix:** issue with GQL errors suchas Bad User Input or Bad Request blocking indefintely transaction hooks.
- 1a2afe7: **chore:** adjusts `UpdateUserPositionConditionsRequest` to latest GQL schema.
- 9765eea: **chore:** support latest minor GQL changes.
- 0dd70a2: **fix:** allow `null` for `WalletClient` parameter in viem hooks
- Updated dependencies [0966b94]
- Updated dependencies [1a2afe7]
- Updated dependencies [9765eea]
  - @aave/client@4.0.0-next.10
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
  - @aave/client@4.0.0-next.9
  - @aave/core@1.0.0-next.6

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
