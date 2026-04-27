# @aave/graphql

## 1.2.0

### Minor Changes

- cfceb7e: **feat:** add `reservesCount` and `activeReservesCount` to `AssetSummary`

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
