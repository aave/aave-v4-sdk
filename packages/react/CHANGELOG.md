# @aave/react

## 4.2.0

### Minor Changes

- cfceb7e: **feat:** add `reservesCount` and `activeReservesCount` to `AssetSummary`
- 7e21fc6: **feat:** add SSR cache hand-off via the new `ssr` option on `AaveClient.create()` and `client.extractData()` / `client.restoreData()` methods
- c4dc4b1: **feat:** add `SpokeSummary`, `SpokeConnectedHub`, `HubSpokeConfig`, and `SpokeSummarySample` types; extend `Spoke` fragment with `summary` and `connectedHubs` fields; add `spokeSummaryHistory` and `hubSpokeConfigs` queries, actions, and hooks (`useHubSpokeConfigs`)

### Patch Changes

- Updated dependencies [cfceb7e]
- Updated dependencies [7e21fc6]
- Updated dependencies [c4dc4b1]
  - @aave/graphql@1.2.0
  - @aave/client@4.2.0
  - @aave/core@1.1.0

## 4.1.1

### Patch Changes

- 5eb65e6: **fix:** optimistically remove claimed reward IDs from `UserClaimableRewards` cache before Merkl propagates
- a5eb3c1: **feat:** add `SpokeLiquidationConfig` type and `liquidationConfig` field to `Spoke` fragment
- Updated dependencies [5eb65e6]
- Updated dependencies [a5eb3c1]
  - @aave/core@1.0.1
  - @aave/client@4.1.1
  - @aave/graphql@1.1.1

## 4.1.0

### Minor Changes

- cdb2f23: **feat:** add `reserveHolders` query, `ReserveHoldersFilter` enum, `useReserveHolders` hook, and `reserves holders` CLI command

### Patch Changes

- 7b4beb6: **fix:** handle Merkl non-tracked claims in `useClaimRewards` and refresh `UserClaimableRewards` cache after successful claim
- Updated dependencies [cdb2f23]
  - @aave/graphql@1.1.0
  - @aave/client@4.1.0

## 4.0.4

### Patch Changes

- b8f65dd: **feat:** add `balance` field to `UserSupplyItem` fragment
- eca42da: **fix:** use fallback RPC transports in `useNetworkFee` for more reliable gas estimation on known chains
- f064787: Add PositionSwapSetCollateralApproval support for V4 adapter refactor

  - Add PositionSwapSetCollateralApproval fragment and union variant to graphql package
  - Add setCollateralSignature field to PreparePositionSwapRequest
  - Handle new approval type in signApprovals helper (spec) and processApprovals (react)
  - Update schema from backend with new V4 adapter types

- Updated dependencies [b8f65dd]
- Updated dependencies [f064787]
  - @aave/graphql@1.0.2
  - @aave/client@4.0.4

## 4.0.3

### Patch Changes

- 0e2969e: **fix:** use viem client defaults for transaction receipt polling and retries
- Updated dependencies [0e2969e]
  - @aave/client@4.0.3

## 4.0.2

### Patch Changes

- Updated dependencies [571ae62]
  - @aave/client@4.0.2

## 4.0.1

### Patch Changes

- 4736e30: Fix Safe wallet transaction flow by resolving safeTxHash to on-chain hash before waiting for receipt. Adds iframe detection and Safe Apps SDK integration with zero overhead for non-Safe users.
- cc2dc64: Support smart contract wallet (Safe) token swaps via presign flow. Adds SwapByTransactionWithApprovalRequired handling for SC wallets that need ERC20 approval before the presign transaction.
- Updated dependencies [4736e30]
- Updated dependencies [cc2dc64]
  - @aave/client@4.0.1
  - @aave/graphql@1.0.1

## 4.0.0

- Aave V4.
