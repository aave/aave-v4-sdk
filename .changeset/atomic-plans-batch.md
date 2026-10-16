---
"@aave/client": minor
"@aave/react": minor
---

**feat:** send multi-step execution plans (approval + action) as one atomic EIP-5792 `wallet_sendCalls` prompt when the wallet is batch-capable, opt-in via `sendWith(walletClient, plan, { batch: true })` and the `{ batch: batchCapability(walletClient) }` option on `useSupply`, `useRepay`, `useBorrow`, `useWithdraw`, `useLiquidatePosition` and `useStableVaultDeposit`; adds `canBatch`, `useCanBatch` and `TransactionBatch` support in the viem and Privy `useSendTransaction`; `sendWith` (viem) now fails before sending when the wallet client is not on the plan's chain
