# Aave React SDK + Safe App

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/aave/aave-v4-sdk/tree/main/examples/react-safe)

This project shows a minimal Safe App flow using `@aave/react/viem` on
Ethereum mainnet.

## Setup

1. Install dependencies:

```bash
pnpm install --ignore-workspace
```

2. Start the development server:

```bash
pnpm dev --host
```

3. Expose the app over HTTPS. For example:

```bash
pnpm dlx tunnelmole 5173
```

If Vite starts on a different port, replace `5173` with that port.

4. Open the generated HTTPS URL from a Safe on Ethereum mainnet.

## Flow

- Read the Safe context with `@safe-global/safe-apps-sdk`
- Create a viem wallet client from the Safe provider
- Supply native ETH into Aave v4 on Ethereum mainnet
- Wait for the final on-chain transaction hash before the flow resolves

If you open the app outside of Safe, it will show a fallback message instead of trying to send transactions.
