# Aave React SDK + Openfort Wallet

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/aave/aave-v4-sdk/tree/main/examples/react-openfort)

Supply GHO on the Aave v4 Core Hub from an [Openfort](https://www.openfort.io)
embedded wallet. Openfort is built on wagmi + viem, so the connected wallet is a
standard viem `WalletClient` that the Aave SDK signs with through the
`@aave/react/viem` adapter.

## Setup

Copy `.env.example` to `.env` and fill in your keys from the
[Openfort dashboard](https://dashboard.openfort.io):

```sh
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_OPENFORT_PUBLISHABLE_KEY` | yes | Openfort publishable key |
| `VITE_SHIELD_PUBLISHABLE_KEY` | yes | Shield publishable key (embedded wallet recovery) |
| `VITE_WALLET_CONNECT_PROJECT_ID` | no | Enables WalletConnect in the connect modal |

Then install and run:

```sh
npm install
npm run dev
```

Sign in with the `OpenfortButton`, create or recover an embedded wallet in the
modal, and supply an amount to the reserve.
