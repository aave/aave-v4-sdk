# @aave/react

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
