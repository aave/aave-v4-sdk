# `@aave/react`  <!-- omit in toc -->

The official React bindings for the Aave Protocol.

---

## Table of Contents <!-- omit in toc -->

- [Getting Started](#getting-started)
- [Read Hooks](#read-hooks)
  - [Loading State](#loading-state)
  - [React Suspense](#react-suspense)
- [Action Hooks](#action-hooks)
- [Viem Integration](#viem-integration)
- [Transaction Hooks](#transaction-hooks)
  - [Simple Transactions](#simple-transactions)
  - [Complex Transactions](#complex-transactions)



## Getting Started

To support development of the Aave v4 UI, the package is currently published on NPM under the alias `@aave/react-next` (private). Once Aave v4 is officially released, this alias will be removed, and the packages will be published under `@aave/react` (which currently contains only the v3 SDK code).

### Setup Access Token <!-- omit in toc -->

First, add the _Aave v4 SDK - NPM Access Token_ shared with you to your `~/.npmrc` file:

```bash
//registry.npmjs.org/:_authToken=TOKEN
```


### Install SDK <!-- omit in toc -->

Next, install the Aave React SDK packages using your package manager of choice.

```bash
pnpm add @aave/react-next@latest

// OR

yarn add @aave/react-next@latest

// OR

npm install @aave/react-next@latest
```

### Setup Client <!-- omit in toc -->

Next, create an `AaveClient` instance that will be used to interact with the protocol.

```ts
// client.ts
import { AaveClient, staging } from "@aave/react-next";

export const client = AaveClient.create({
  environment: staging,
});
```

> [!WARNING]
> You should NOT install the `@aave/client-next` package directly, nor any of the other `@aave/*` sub-packages as they are already included and re-exported by the `@aave/react-next` package.

### Setup Provider <!-- omit in toc -->

Finally, wrap your app with the `<AaveProvider>` component and pass the client instance.

```tsx
// App.tsx
import { AaveProvider } from "@aave/react-next";

import { client } from "./client";

export function App() {
  return (
    <AaveProvider client={client}>
      {/* Your application components */}
    </AaveProvider>
  );
}
```

## Read Hooks

All read hooks support **two ways of operating**: loading state and React Suspense.

### Loading State

Handle loading state manually in your component:

```tsx
function ChainsList() {
  const { data, loading, error } = useAaveChains();

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((chain) => (
        <div key={chain.id}>{chain.name}</div>
      ))}
    </div>
  );
}
```

### React Suspense

Let React handle loading states automatically through a [Suspense boundary](https://react.dev/reference/react/Suspense).

```tsx
// Component - no loading states needed
function ChainsList() {
  const { data: chains } = useAaveChains({
    suspense: true, // Enable suspense mode
  });

  return (
    <div>
      {chains.map((chain) => (
        <div key={chain.id}>{chain.name}</div>
      ))}
    </div>
  );
}

// Parent - wrap with Suspense boundary
function ChainsPage() {
  return (
    <Suspense fallback={<div>Loading …</div>}>
      <ChainsList />
    </Suspense>
  );
}
```

> [!NOTE]
> You can handle errors in the parent component by wrapping the component with a [Error boundary component](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).


## Action Hooks

The Aave React SDK provides action hooks that are designed to be triggered manually when you need to perform an operation. Action hooks return an execute function and a state object.

```tsx
const [execute, state] = useActionHook();
```

### Execute Function <!-- omit in toc -->

The `execute` function returns a `ResultAsync<T, E>`, a thenable object that represents one of two states:

- `Ok<T>`: A **successful** result containing a value of type `T`
- `Err<E>`: A **failure** containing an error of type `E`

Awaiting a `ResultAsync<T, E>` resolves to a `Result<T, E>`.

With a `Result<T, E>`, you can use the convenient `isOk()` and `isErr()` methods to check the outcome and narrow the type.  
If you have a `ResultAsync<T, E>`, you must first `await` it to access those methods.

```ts
const result = await execute();

if (result.isOk()) {
  console.log("Result:", result.value);
} else {
  console.error("Error:", result.error);
}
```

This approach avoids reliance on `try/catch` blocks and promotes predictable, type-safe code by ensuring errors are handled explicitly.

> [!NOTE]
> See the [NeverThrow documentation](https://github.com/supermacro/neverthrow) for more information. The NeverThrow library is re-exported for convenience.

### State Object <!-- omit in toc -->

The state object returned by action hooks provides information about the current operation status:

```ts
const { called, data, error, loading } = state;
```

Where:

- `called`: `true` when the operation has been executed at least once, `false` otherwise
- `data`: Contains the last successful result of type `T`, `undefined` otherwise
- `error`: Contains the error of type `E` if the operation failed, `undefined` otherwise
- `loading`: `true` when the operation is in progress, `false` otherwise

## Viem Integration

To send transactions through the connected wallet, use the `useSendTransaction` action hook.

```tsx
const [sendTransaction, { loading, error }] = useSendTransaction(/* args */);
```

Import the `useSendTransaction` hook from the `@aave/react-next/viem` entry point and wire it up with the viem's `WalletClient`.

```tsx
import { useSendTransaction } from "@aave/react-next/viem";
import { useWalletClient } from "wagmi";

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  const [sendTransaction, sending] = useSendTransaction(walletClient);

  // Use with transaction hooks…
}
```

> [!NOTE]
> The example uses [wagmi](https://wagmi.sh/) to get the `WalletClient` from the connected wallet.


## Transaction Hooks

Transaction hooks are a specific type of action hooks that handle protocol interactions like supply, borrow, withdraw, repay, and more.

There are two types of transaction hooks:

- **Simple transactions** - single transactions that can be sent directly to the wallet
- **Complex transactions** - transactions that could require approval beforehand

### Simple Transactions

To handle a simple transaction hook, follow the steps below.


#### Use Hooks <!-- omit in toc -->

First, instantiate the specific transaction hook and the `useSendTransaction` hook.

```tsx
const [prepare, preparing] = useSimpleTransaction();
const [sendTransaction, sending] = useSendTransaction(/* … */);
```

#### Execute the Transaction <!-- omit in toc -->

Next, execute the transaction in your callback by chaining the prepare and send operations.

```ts
const result = await prepare(/* args */).andThen(sendTransaction);
```

Optionally, combine the state objects to drive your UI components.

```ts
const loading = preparing.loading && sending.loading;
const error = preparing.error || sending.error;
```

#### Handle the Result <!-- omit in toc -->

Finally, handle the result of the operation.


**Imperative Fashion**

```ts
if (result.isErr()) {
  switch (result.error.name) {
    case "SigningError":
      // Most likely the user rejected the transaction
      console.error(`Failed to sign the transaction: ${error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${error.message}`);
      break;

    case "UnexpectedError":
      console.error(error.message);
      break;
  }
} else {
  console.log("Transaction sent with hash:", result.value);
}
```

**Declarative Fashion**

```tsx
function MyComponent() {
  // …

  const loading = preparing.loading || sending.loading;
  const error = preparing.error || sending.error;

  return (
    <div>
      <button disabled={loading}>
        {loading ? "Sending…" : "Send Transaction"}
      </button>

      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```

### Complex Transactions

To handle a complex transaction hook, follow the steps below.

#### Use Hooks <!-- omit in toc -->

First, instantiate the transaction hook and the `useSendTransaction` hook.

```tsx
const [prepare, preparing] = useComplexTransaction();
const [sendTransaction, sending] = useSendTransaction(/* … */);
```

Optionally, combine the state objects to drive your UI components.

```ts
const loading = preparing.loading && sending.loading;
const error = preparing.error || sending.error;
```

#### Process the Execution Plan <!-- omit in toc -->

Next, handle the execution plan in your transaction flow. Some operations may require token approval before executing the main transaction.

```ts
import { errAsync } from "@aave/react-next";

// …

const result = await prepare(/* args */).andThen((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "ApprovalRequired":
      return sendTransaction(plan.approval).andThen(() =>
        sendTransaction(plan.originalTransaction)
      );

    case "InsufficientBalanceError":
      return errAsync(
        new Error(`Insufficient balance: ${plan.required.value} required.`)
      );
  }
});

// …
```

> [!NOTE]
> If you wish to ask the user for confirmation before sending the transaction, you can do so by integrating your app's confirmation UI at this point.

#### Handle the Result <!-- omit in toc -->

Finally, handle the result of the operation.


**Imperative Fashion**

```ts
if (result.isErr()) {
  switch (result.error.name) {
    case "SigningError":
      // Most likely the user rejected the transaction
      console.error(`Failed to sign the transaction: ${error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${error.message}`);
      break;

    case "UnexpectedError":
      console.error(error.message);
      break;
  }
} else {
  console.log("Transaction sent with hash:", result.value);
}
```

**Declarative Fashion**

```tsx
function MyComponent() {
  // …

  const loading = preparing.loading || sending.loading;
  const error = preparing.error || sending.error;

  return (
    <div>
      <button disabled={loading}>
        {loading ? "Sending…" : "Send Transaction"}
      </button>

      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```
