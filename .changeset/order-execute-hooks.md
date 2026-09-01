---
"@aave/graphql": minor
"@aave/client": minor
"@aave/react": minor
---

**feat:** add Order-API execute hooks for swaps so position and token swaps run through `submitOrder`/`prepareOrder` alongside `useLeverage`:

- `useSupplySwapOrder`, `useBorrowSwapOrder`, `useRepayWithSupplyOrder`, `useWithdrawSwapOrder` — position swaps via a new `PositionOrderHandler` and `processPositionOrderApprovals`, which maps the `PositionSwap*Approval` nodes onto the same `PrepareOrderRequest` signature fields and seeds the order id from `SwapQuote.orderQuoteId`.
- `useTokenSwapOrder` — token swaps through `prepareOrder`/`submitOrder`, handling the by-transaction, by-intent, and ERC-20-pre-approval quote variants.

Each execute hook mirrors its `useXSwapQuote` counterpart (`useSupplySwapQuote` ↔ `useSupplySwapOrder`).

Deprecate the swap-verb hooks (`useSupplySwap`, `useBorrowSwap`, `useRepayWithSupply`, `useWithdrawSwap`, `useTokenSwap`, `useSwapStatus`, `useUserSwaps`, `useCancelSwap`) in favour of their Order equivalents. They remain fully functional and will be removed in a later release.

Add `OrderTypedData` to the signer `TypedData` union so order typed data can be signed through the viem, ethers, thirdweb, and privy adapters (previously only `SwapTypedData`/`PermitTypedData` were accepted, which also blocked signing the final leverage order).
