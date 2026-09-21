# @aave/core

## 1.1.2

### Patch Changes

- 03a23d7: **fix:** coalesce same-key query operations onto in-flight network requests instead of issuing duplicates, in both the batched (`batchFetchExchange`) and non-batched (`inFlightDedupExchange` + `fetchExchange`) pipelines

## 1.1.1

### Patch Changes

- 3850316: **fix:** preserve `content-type` and custom `headers` on batched GraphQL requests

## 1.1.0

### Minor Changes

- 7e21fc6: **feat:** add SSR cache hand-off via the new `ssr` option on `AaveClient.create()` and `client.extractData()` / `client.restoreData()` methods

## 1.0.1

### Patch Changes

- 5eb65e6: **fix:** optimistically remove claimed reward IDs from `UserClaimableRewards` cache before Merkl propagates

## 1.0.0

- Aave V4.
