# `@aave/client`

The official TypeScript client for interacting with Aave Protocol v4.

---

`@aave/client` exposes the core Aave v4 actions through a type-safe interface with integrated error handling and result types.


## Install SDK

First, install the AaveKit TypeScript package using your package manager of choice.

```bash
pnpm add @aave/client@v4

// OR

yarn add @aave/client@v4

// OR

npm install @aave/client@v4
```

## Setup Client 

```ts
// client.ts
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

## Usage

```ts
import { chains } from '@aave/client/actions';
import { ChainsFilter } from '@aave/client';
import { client } from './client';

// Query chains by filter
const result = await chains(client, {
  query: { filter: ChainsFilter.ALL },
});

if (result.isOk()) {
  console.log("Chains:", result.value); // Chain[]
} else {
  console.error("Error:", result.error);
}
```
