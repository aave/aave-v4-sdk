# @aave/cli

## 4.2.2

### Patch Changes

- Updated dependencies [cfceb7e]
  - @aave/client@4.2.0

## 4.2.1

### Patch Changes

- Updated dependencies [5eb65e6]
- Updated dependencies [a5eb3c1]
  - @aave/client@4.1.1

## 4.2.0

### Minor Changes

- cdb2f23: **feat:** add `reserveHolders` query, `ReserveHoldersFilter` enum, `useReserveHolders` hook, and `reserves holders` CLI command
- 46893ab: **feat:** add market token swap command
- 37c1fe3: feat: add user summary cli command
- cb7ec01: **feat:** add reserve lookup command and move user queries under "user" command

### Patch Changes

- e0b9968: **feat:** add 'user balance' command
- Updated dependencies [cdb2f23]
  - @aave/client@4.1.0

## 4.1.4

### Patch Changes

- b8f65dd: **feat:** add `balance` field to `UserSupplyItem` fragment
- 5277e51: **feat:** add supply action command to CLI
- ad3e905: **feat:** add repay/withdraw command actions
- b504b5c: **feat:** add borrow action command
- f064787: Add PositionSwapSetCollateralApproval support for V4 adapter refactor

  - Add PositionSwapSetCollateralApproval fragment and union variant to graphql package
  - Add setCollateralSignature field to PreparePositionSwapRequest
  - Handle new approval type in signApprovals helper (spec) and processApprovals (react)
  - Update schema from backend with new V4 adapter types

- Updated dependencies [b8f65dd]
- Updated dependencies [f064787]
  - @aave/client@4.0.4

## 4.1.3

### Patch Changes

- Updated dependencies [0e2969e]
  - @aave/client@4.0.3

## 4.1.2

### Patch Changes

- Updated dependencies [571ae62]
  - @aave/client@4.0.2

## 4.1.1

### Patch Changes

- cc2dc64: Support smart contract wallet (Safe) token swaps via presign flow. Adds SwapByTransactionWithApprovalRequired handling for SC wallets that need ERC20 approval before the presign transaction.
- Updated dependencies [4736e30]
- Updated dependencies [cc2dc64]
  - @aave/client@4.0.1

## 4.1.0

- Aave V4.
