# Aave React SDK + Safe App

Small Safe App example that supplies GHO on Ethereum mainnet with `@aave/react`.

## Run locally

```bash
pnpm install --ignore-workspace --no-lockfile
pnpm dev
```

Then open Safe, go to Apps, add a custom app, and enter your local Vite URL.
The Safe must be on Ethereum mainnet because the example filters reserves by
GHO on chain `1`.

The example shows how to:

- read Safe context with `@safe-global/safe-apps-sdk`
- expose the Safe as a viem wallet client through a small EIP-1193 adapter
- use `@aave/react` hooks inside a Safe App
- queue approval and supply transactions through Safe
