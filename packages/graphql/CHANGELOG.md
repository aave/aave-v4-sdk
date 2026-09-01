# @aave/graphql

## 3.4.0

### Minor Changes

- 97aaf27: **feat:** sync schema with staging: `OrderErc20Approval` joins the `OrderApproval` union (server-built ERC-20 top-up permit, handled by `useLeverage`), `ActivityType.Leverage`, leverage `quoteId` inputs typed as `OrderQuoteId`, and `MarketLeverageQuoteInput.multiplier` is optional
- bd2bdf3: **feat:** add the Order API (`submitOrder`, `cancelOrder`, `prepareOrder`, `orderStatus`, `pendingOrders`, `prepareCancelOrder`) and leverage support (`leverageQuote`, `Leverage`, `LeverageActivity`), with matching `useLeverage`, `useLeverageQuote`, `useOrderStatus`, `usePendingOrders`, and `useCancelOrder` hooks
- 1f0c2fd: **feat:** add Order-API execute hooks for swaps so position and token swaps run through `submitOrder`/`prepareOrder` alongside `useLeverage`:

  - `useSupplySwapOrder`, `useBorrowSwapOrder`, `useRepayWithSupplyOrder`, `useWithdrawSwapOrder` — position swaps via a new `PositionOrderHandler` and `processPositionOrderApprovals`, which maps the `PositionSwap*Approval` nodes onto the same `PrepareOrderRequest` signature fields and seeds the order id from `SwapQuote.orderQuoteId`.
  - `useTokenSwapOrder` — token swaps through `prepareOrder`/`submitOrder`, handling the by-transaction, by-intent, and ERC-20-pre-approval quote variants.

  Each execute hook mirrors its `useXSwapQuote` counterpart (`useSupplySwapQuote` ↔ `useSupplySwapOrder`).

  Deprecate the swap-verb hooks (`useSupplySwap`, `useBorrowSwap`, `useRepayWithSupply`, `useWithdrawSwap`, `useTokenSwap`, `useSwapStatus`, `useUserSwaps`, `useCancelSwap`) in favour of their Order equivalents. They remain fully functional and will be removed in a later release.

  Add `OrderTypedData` to the signer `TypedData` union so order typed data can be signed through the viem, ethers, thirdweb, and privy adapters (previously only `SwapTypedData`/`PermitTypedData` were accepted, which also blocked signing the final leverage order).

## 3.3.0

### Minor Changes

- 9164edd: **feat:** expose `ReserveSummary.underlyingApy`, the yield an asset earns outside the pool rate

## 3.2.0

### Minor Changes

- 2dde326: **feat:** support multichain user claimable rewards queries

## 3.1.0

### Minor Changes

- f353446: **feat:** Added `includeRewards` to borrow and supply APY history requests.
- db2bc7b: protocolHistory: replace single `chainId` with `chainIds: [ChainId!]` to filter protocol history across multiple chain
- 1b6ee19: **feat:** add `multichainAsset` query, action, and `useMultichainAsset` hook for fetching an asset aggregated across chains, plus `tokenInfo`/`symbol` query variants for `reserves` and `userTokenInfo`/`userSymbol` query variants for `userSupplies` and `userBorrows`

### Patch Changes

- d39f1e2: **feat:** expose `liquidatorReceived`, `liquidationFee`, and `liquidationHealthFactor` on `LiquidatedActivity`, plus `canonicalSymbol` on `TokenInfo`
- ff75357: **feat:** Add `chainId` to `protocolHistory` request types

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
