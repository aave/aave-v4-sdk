# `@aave/react`

The official React hooks for the Aave Protocol v4.

---

`@aave/react` provides a collection of React hooks for building decentralized applications on top of the Aave Protocol v4.

## Install SDK

First, install the AaveKit React package using your package manager of choice.

```bash
pnpm add @aave/react@v4

// OR

yarn add @aave/react@v4

// OR

npm install @aave/react@v4
```

## Setup Client

Next, create an `AaveClient` instance that will be used to interact with the protocol.

```ts
// client.ts
import { AaveClient } from "@aave/react";

export const client = AaveClient.create();
```

## Setup Provider

Finally, wrap your app with the `<AaveProvider>` component and pass the client instance.

```tsx
// App.tsx
import { AaveProvider } from "@aave/react";

import { client } from "./client";

export function App() {
  return (
    <AaveProvider client={client}>
      {/* Your application components */}
    </AaveProvider>
  );
}
```

## Usage

That's it—you can now start using AaveKit React hooks.

```tsx
import { useChains } from '@aave/react';
import { ChainsFilter } from '@aave/react';

function ChainsList() {
  const { data, error, loading } = useChains({
    query: { filter: ChainsFilter.ALL },
  });

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((chain) => (
        <div key={chain.chainId}>{chain.name}</div>
      ))}
    </div>
  );
}
```
