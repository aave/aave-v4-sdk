# @aave/client

## 4.0.0-next.5

### Minor Changes

- fe65fe9: **feat:** viem integration to leverage API as source of truth about chain details.

### Patch Changes

- e903ab5: **chore:** removes batching by aliases in favour of batching GQL-over-HTTP.
- Updated dependencies [fe65fe9]
- Updated dependencies [e903ab5]
  - @aave/graphql@1.0.0-next.5
  - @aave/core@1.0.0-next.4

## 4.0.0-next.4

### Minor Changes

- be462e6: **feat:** smart baching of GQL queries.

### Patch Changes

- 009995d: **feat:** expose hubId filters for user balances and reserves.
- 79bef0a: **fix:** remove client-side sorting for activities to preserve backend ordering.
- 464b6f2: **fix:** thirdweb integration to support chains based on tenderly forks.
- de80d52: **fix:** emit `CancelError` from Ethers.js integrations and ensures to be on correct chain before sending tx.
- Updated dependencies [009995d]
- Updated dependencies [be462e6]
- Updated dependencies [de80d52]
  - @aave/graphql@1.0.0-next.4
  - @aave/core@1.0.0-next.3
  - @aave/types@1.0.0-next.3

## 4.0.0-next.3

### Patch Changes

- 39649f8: **fix:** `BigDecimal#toDisplayString(n)` behaviour with `minFractionDigits` (see test).
- Updated dependencies [39649f8]
  - @aave/types@1.0.0-next.2
  - @aave/core@1.0.0-next.2
  - @aave/graphql@1.0.0-next.3

## 4.0.0-next.2

### Patch Changes

- 7ed8ac6: **fix:** rebuild from local
- Updated dependencies [7ed8ac6]
  - @aave/core@1.0.0-next.1
  - @aave/graphql@1.0.0-next.2
  - @aave/types@1.0.0-next.1

## 4.0.0-next.1

### Patch Changes

- 9aa3438: **fix:** updates `DecimalNumeberWithChange#change` to be `PercentNumber` and not `DecimalNumber`
- Updated dependencies [9aa3438]
  - @aave/graphql@1.0.0-next.1

## 4.0.0-next.0

### Major Changes

- 7789c8e: **feat:** new AaveKit v4.

### Patch Changes

- Updated dependencies [7789c8e]
  - @aave/graphql@1.0.0-next.0
  - @aave/types@1.0.0-next.0
  - @aave/core@1.0.0-next.0
