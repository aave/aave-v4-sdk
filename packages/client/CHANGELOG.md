# @aave/client

## 4.2.0

### Minor Changes

- cfceb7e: **feat:** add `reservesCount` and `activeReservesCount` to `AssetSummary`

### Patch Changes

- Updated dependencies [cfceb7e]
  - @aave/graphql@1.2.0

## 4.1.1

### Patch Changes

- 5eb65e6: **fix:** optimistically remove claimed reward IDs from `UserClaimableRewards` cache before Merkl propagates
- a5eb3c1: **feat:** add `SpokeLiquidationConfig` type and `liquidationConfig` field to `Spoke` fragment
- Updated dependencies [5eb65e6]
- Updated dependencies [a5eb3c1]
  - @aave/core@1.0.1
  - @aave/graphql@1.1.1

## 4.1.0

### Minor Changes

- cdb2f23: **feat:** add `reserveHolders` query, `ReserveHoldersFilter` enum, `useReserveHolders` hook, and `reserves holders` CLI command

### Patch Changes

- Updated dependencies [cdb2f23]
  - @aave/graphql@1.1.0

## 4.0.4

### Patch Changes

- b8f65dd: **feat:** add `balance` field to `UserSupplyItem` fragment
- f064787: Add PositionSwapSetCollateralApproval support for V4 adapter refactor

  - Add PositionSwapSetCollateralApproval fragment and union variant to graphql package
  - Add setCollateralSignature field to PreparePositionSwapRequest
  - Handle new approval type in signApprovals helper (spec) and processApprovals (react)
  - Update schema from backend with new V4 adapter types

- Updated dependencies [b8f65dd]
- Updated dependencies [f064787]
  - @aave/graphql@1.0.2

## 4.0.3

### Patch Changes

- 0e2969e: **fix:** use viem client defaults for transaction receipt polling and retries

## 4.0.2

### Patch Changes

- 571ae62: Fix Safe wallet detection failing due to allowedDomains regex not matching the full origin (https://app.safe.global). Also restore webpackIgnore comment for dynamic import and increase getInfo timeout from 200ms to 5s.

## 4.0.1

### Patch Changes

- 4736e30: Fix Safe wallet transaction flow by resolving safeTxHash to on-chain hash before waiting for receipt. Adds iframe detection and Safe Apps SDK integration with zero overhead for non-Safe users.
- cc2dc64: Support smart contract wallet (Safe) token swaps via presign flow. Adds SwapByTransactionWithApprovalRequired handling for SC wallets that need ERC20 approval before the presign transaction.
- Updated dependencies [cc2dc64]
  - @aave/graphql@1.0.1

## 4.0.0

- Aave V4.
