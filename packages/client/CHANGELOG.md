# @aave/client

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
