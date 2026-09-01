# @aave/react

## 6.5.0

### Minor Changes

- 97aaf27: **feat:** sync schema with staging: `OrderErc20Approval` joins the `OrderApproval` union (server-built ERC-20 top-up permit, handled by `useLeverage`), `ActivityType.Leverage`, leverage `quoteId` inputs typed as `OrderQuoteId`, and `MarketLeverageQuoteInput.multiplier` is optional
- bd2bdf3: **feat:** add the Order API (`submitOrder`, `cancelOrder`, `prepareOrder`, `orderStatus`, `pendingOrders`, `prepareCancelOrder`) and leverage support (`leverageQuote`, `Leverage`, `LeverageActivity`), with matching `useLeverage`, `useLeverageQuote`, `useOrderStatus`, `usePendingOrders`, and `useCancelOrder` hooks
- 1f0c2fd: **feat:** add Order-API execute hooks for swaps so position and token swaps run through `submitOrder`/`prepareOrder` alongside `useLeverage`:

  - `useSupplySwapOrder`, `useBorrowSwapOrder`, `useRepayWithSupplyOrder`, `useWithdrawSwapOrder` — position swaps via a new `PositionOrderHandler` and `processPositionOrderApprovals`, which maps the `PositionSwap*Approval` nodes onto the same `PrepareOrderRequest` signature fields and seeds the order id from `SwapQuote.orderQuoteId`.
  - `useTokenSwapOrder` — token swaps through `prepareOrder`/`submitOrder`, handling the by-transaction, by-intent, and ERC-20-pre-approval quote variants.

  Each execute hook mirrors its `useXSwapQuote` counterpart (`useSupplySwapQuote` ↔ `useSupplySwapOrder`).

  Deprecate the swap-verb hooks (`useSupplySwap`, `useBorrowSwap`, `useRepayWithSupply`, `useWithdrawSwap`, `useTokenSwap`, `useSwapStatus`, `useUserSwaps`, `useCancelSwap`) in favour of their Order equivalents. They remain fully functional and will be removed in a later release.

  Add `OrderTypedData` to the signer `TypedData` union so order typed data can be signed through the viem, ethers, thirdweb, and privy adapters (previously only `SwapTypedData`/`PermitTypedData` were accepted, which also blocked signing the final leverage order).

### Patch Changes

- 9947bdc: **fix:** read hooks keep presenting the previous error while a re-execution after a rejected request is in flight, instead of handing a `null` result to selectors
- Updated dependencies [97aaf27]
- Updated dependencies [bd2bdf3]
- Updated dependencies [1f0c2fd]
  - @aave/graphql@3.4.0
  - @aave/client@6.5.0

## 6.4.0

### Minor Changes

- 9164edd: **feat:** expose `ReserveSummary.underlyingApy`, the yield an asset earns outside the pool rate

### Patch Changes

- Updated dependencies [9164edd]
  - @aave/graphql@3.3.0
  - @aave/client@6.4.0

## 6.3.1

### Patch Changes

- 3850316: **fix:** preserve `content-type` and custom `headers` on batched GraphQL requests
- Updated dependencies [3850316]
  - @aave/core@1.1.1
  - @aave/client@6.3.1

## 6.3.0

### Minor Changes

- 2dde326: **feat:** support multichain user claimable rewards queries

### Patch Changes

- Updated dependencies [2dde326]
  - @aave/graphql@3.2.0
  - @aave/client@6.3.0

## 6.2.1

### Patch Changes

- c28989b: **fix:** `useSignTypedData` (viem adapter) now switches the wallet to the typed data's `domain.chainId` before signing, preventing `Provided chainId must match the active chainId` errors
  - @aave/client@6.2.1

## 6.2.0

### Minor Changes

- f353446: **feat:** Added `includeRewards` to borrow and supply APY history requests.
- db2bc7b: protocolHistory: replace single `chainId` with `chainIds: [ChainId!]` to filter protocol history across multiple chain
- 1b6ee19: **feat:** add `multichainAsset` query, action, and `useMultichainAsset` hook for fetching an asset aggregated across chains, plus `tokenInfo`/`symbol` query variants for `reserves` and `userTokenInfo`/`userSymbol` query variants for `userSupplies` and `userBorrows`

### Patch Changes

- a76557e: **fix:** re-create viem wallet client with correct chain after switching in `useSendTransaction` to prevent stale chain reference errors
- d39f1e2: **feat:** expose `liquidatorReceived`, `liquidationFee`, and `liquidationHealthFactor` on `LiquidatedActivity`, plus `canonicalSymbol` on `TokenInfo`
- ff75357: **feat:** Add `chainId` to `protocolHistory` request types
- Updated dependencies [a76557e]
- Updated dependencies [f353446]
- Updated dependencies [db2bc7b]
- Updated dependencies [1b6ee19]
- Updated dependencies [d39f1e2]
- Updated dependencies [ff75357]
  - @aave/client@6.2.0
  - @aave/graphql@3.1.0

## 6.1.0

### Patch Changes

- Updated dependencies [0ebdca4]
- Updated dependencies [1d8269d]
- Updated dependencies [0ebdca4]
  - @aave/client@6.1.0
  - @aave/graphql@3.0.1

## 6.0.0

### Patch Changes

- Updated dependencies [68eb092]
  - @aave/graphql@3.0.0
  - @aave/client@6.0.0

## 5.0.0

### Patch Changes

- Updated dependencies [8fc4e62]
  - @aave/graphql@2.0.0
  - @aave/client@5.0.0

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
