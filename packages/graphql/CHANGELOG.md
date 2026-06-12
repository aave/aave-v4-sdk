# @aave/graphql

## 3.1.0

### Minor Changes

- f353446: **feat:** Added `includeRewards` to borrow and supply APY history requests.

## 3.0.1

### Patch Changes

- 0ebdca4: **feat:** add `nativeWrappedInfo` field to `Chain` fragment

## 3.0.0

### Major Changes

- 68eb092: Realign with backend after the PreviewReward types were restored. The backend now exposes both the legacy `PreviewReward` union (`PreviewMerkl{Supply,Borrow}Reward` + `Preview{Supply,Borrow}PointsReward`) via deprecated `PreviewRewardOutcome.lost` / `.gained`, and the new wrapper as `ReserveReward` via `PreviewRewardOutcome.abandoned` / `.acquired`. Rename `PreviewRewardChange` to `ReserveReward` and switch the `PreviewRewardOutcome` fragment to query `abandoned` / `acquired` (breaking for the previous 2.0.0 shape).

## 2.0.0

### Major Changes

- 8fc4e62: Unify preview reward types into PreviewRewardChange { reserve, reward } reusing the Reward union; removes PreviewMerkl*/PreviewPoints* preview-specific types and the PreviewReward union (breaking).

## 1.2.0

### Minor Changes

- cfceb7e: **feat:** add `reservesCount` and `activeReservesCount` to `AssetSummary`
- c4dc4b1: **feat:** add `SpokeSummary`, `SpokeConnectedHub`, `HubSpokeConfig`, and `SpokeSummarySample` types; extend `Spoke` fragment with `summary` and `connectedHubs` fields; add `spokeSummaryHistory` and `hubSpokeConfigs` queries, actions, and hooks (`useHubSpokeConfigs`)

## 1.1.1

### Patch Changes

- a5eb3c1: **feat:** add `SpokeLiquidationConfig` type and `liquidationConfig` field to `Spoke` fragment

## 1.1.0

### Minor Changes

- cdb2f23: **feat:** add `reserveHolders` query, `ReserveHoldersFilter` enum, `useReserveHolders` hook, and `reserves holders` CLI command

## 1.0.2

### Patch Changes

- b8f65dd: **feat:** add `balance` field to `UserSupplyItem` fragment
- f064787: Add PositionSwapSetCollateralApproval support for V4 adapter refactor

  - Add PositionSwapSetCollateralApproval fragment and union variant to graphql package
  - Add setCollateralSignature field to PreparePositionSwapRequest
  - Handle new approval type in signApprovals helper (spec) and processApprovals (react)
  - Update schema from backend with new V4 adapter types

## 1.0.1

### Patch Changes

- cc2dc64: Support smart contract wallet (Safe) token swaps via presign flow. Adds SwapByTransactionWithApprovalRequired handling for SC wallets that need ERC20 approval before the presign transaction.

## 1.0.0

- Aave V4.
