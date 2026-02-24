# Result-Aware Selectors for useSuspendableQuery

## Overview

Change `useSuspendableQuery` selector signature from `(data: T) => V` to `(data: T) => Result<V, E>`, enabling type-safe error handling where selector-derived errors flow through to `ReadResult<V, E | UnexpectedError>`.

## Motivation

Currently, selectors throw errors (e.g., `ValidationError`, `UnexpectedError`) which are not type-safe. The TODO at [swap.ts:97](packages/react/src/swap.ts#L97) notes this:

```ts
// TODO rethink this approach so that selector errors are not thrown but returned as UnexpectedError
```

With Result-returning selectors:
- Error types are explicit in the return type
- Consumers know exactly what errors to expect
- In suspense mode, errors are still thrown (for Error Boundaries)
- In non-suspense mode, errors appear in the `error` field with proper typing

## Design

### Type Changes

**`packages/react/src/helpers/results.ts`**

Remove the `E extends UnexpectedError` constraint to allow any error type:

```ts
// Before
export type ReadResult<T, E extends UnexpectedError = UnexpectedError> = ...
export type PausableReadResult<T, E extends UnexpectedError = UnexpectedError> = ...

// After
export type ReadResult<T, E = UnexpectedError> = ...
export type PausableReadResult<T, E = UnexpectedError> = ...
```

**`packages/react/src/helpers/reads.ts`**

Update `Selector` type to return `Result`:

```ts
// Before
export type Selector<T, V> = (data: T) => V;

// After
export type Selector<T, V, E> = (data: T) => Result<V, E>;
```

Update `UseSuspendableQueryArgs` with renamed type parameters and new `SelectorError`:

```ts
export type UseSuspendableQueryArgs<
  ResponseValue,      // renamed from Value
  SelectorData,       // renamed from Output
  SelectorError,      // new
  Variables extends AnyVariables,
  Suspense extends boolean,
  Pause extends boolean = never,
> = {
  document: TypedDocumentNode<StandardData<ResponseValue>, Variables>;
  variables?: Pause extends boolean ? NullishDeep<Variables> : Variables;
  suspense: Suspense;
  selector?: Selector<ResponseValue, SelectorData, SelectorError>;
  pollInterval?: number;
  batch?: boolean;
  pause?: Pause;
};
```

Default selector uses `ok` from `@aave/types`:

```ts
selector = ok as Selector<ResponseValue, SelectorData, SelectorError>
```

### Implementation Changes

**`packages/react/src/helpers/reads.ts`**

Handle `Result` from selector:

```ts
export function useSuspendableQuery<
  ResponseValue,
  SelectorData,
  SelectorError,
  Variables extends AnyVariables,
>({
  selector = ok as Selector<ResponseValue, SelectorData, SelectorError>,
  // ...
}): SuspendableResult<SelectorData, SelectorError | UnexpectedError> {

  // ... existing useQuery logic ...

  // Paused state
  if (pause) {
    const selected = data ? selector(data.value) : undefined;
    return ReadResult.Paused(
      selected?.isOk() ? selected.value : undefined,
      selected?.isErr() ? selected.error : (error ? UnexpectedError.from(error) : undefined),
    );
  }

  // Success path
  if (data) {
    const result = selector(data.value);

    if (result.isErr()) {
      if (suspense) {
        throw result.error;  // Error Boundary catches it
      }
      return ReadResult.Failure(result.error, reloading);
    }

    return ReadResult.Success(result.value, reloading);
  }

  // ... error handling ...
}
```

### Selector Migrations

**`packages/react/src/swap.ts`**

Migrate `extractTokenSwapQuote`:

```ts
// Before
function extractTokenSwapQuote(data: TokenSwapQuoteResult): SwapQuote {
  switch (data.__typename) {
    case 'SwapByIntent':
    case 'SwapByIntentWithApprovalRequired':
    case 'SwapByTransaction':
      return data.quote;
    case 'InsufficientLiquidityError':
      throw ValidationError.fromGqlNode(data);
    default:
      throw UnexpectedError.upgradeRequired(`Unsupported swap quote result: ${data.__typename}`);
  }
}

// After
function extractTokenSwapQuote(
  data: TokenSwapQuoteResult
): Result<SwapQuote, ValidationError<InsufficientLiquidityError> | UnexpectedError> {
  switch (data.__typename) {
    case 'SwapByIntent':
    case 'SwapByIntentWithApprovalRequired':
    case 'SwapByTransaction':
      return ok(data.quote);
    case 'InsufficientLiquidityError':
      return err(ValidationError.fromGqlNode(data));
    default:
      return err(UnexpectedError.upgradeRequired(`Unsupported swap quote result: ${data.__typename}`));
  }
}
```

Same pattern for `extractPositionSwapQuote`.

Remove the TODO comment at line 97.

**`packages/react/src/reserves.ts`**

Update `UseReservesArgs` type:

```ts
// Before
export type UseReservesArgs<T = Reserve[]> = Prettify<
  ReservesRequest & CurrencyQueryOptions & TimeWindowQueryOptions & {
    selector?: Selector<Reserve[], T>;
  }
>;

// After
export type UseReservesArgs<T = Reserve[], E = never> = Prettify<
  ReservesRequest & CurrencyQueryOptions & TimeWindowQueryOptions & {
    selector?: Selector<Reserve[], T, E>;
  }
>;
```

Remove TSDoc examples referencing `pickHighestSupplyApyReserve` and `pickLowestBorrowApyReserve` as selectors (they remain as utility functions in `@aave/client`).

## Files to Change

| File | Change |
|------|--------|
| `packages/react/src/helpers/results.ts` | Remove `E extends UnexpectedError` constraint |
| `packages/react/src/helpers/reads.ts` | Update `Selector` type, rename type params, update implementation |
| `packages/react/src/swap.ts` | Migrate selectors to return `Result`, remove TODO |
| `packages/react/src/reserves.ts` | Update `UseReservesArgs` type, remove selector TSDoc examples |

## Breaking Changes

1. **Selector signature**: `(data: T) => V` → `(data: T) => Result<V, E>`
2. **`useReserves` selector parameter**: Now requires `Result`-returning function
3. **ReadResult/PausableReadResult**: Error type no longer constrained to `UnexpectedError`

## Migration for Consumers

Users with custom selectors need to wrap returns in `ok()`:

```ts
// Before
selector: (reserves) => reserves.filter(r => r.isActive)

// After
selector: (reserves) => ok(reserves.filter(r => r.isActive))
```

For selectors that can fail:

```ts
selector: (reserves) => {
  const found = reserves.find(r => r.id === targetId);
  return found ? ok(found) : err(new NotFoundError('Reserve not found'));
}
```
