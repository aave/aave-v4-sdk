@aave/cli
=================

CLI to interact with AaveKit API

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@aave/cli.svg)](https://npmjs.org/package/@aave/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@aave/cli.svg)](https://npmjs.org/package/@aave/cli)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @aave/cli
$ aave COMMAND
running command...
$ aave (--version)
@aave/cli/4.1.4 darwin-arm64 node-v25.9.0
$ aave --help [COMMAND]
USAGE
  $ aave COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`aave action borrow`](#aave-action-borrow)
* [`aave action repay`](#aave-action-repay)
* [`aave action supply`](#aave-action-supply)
* [`aave action withdraw`](#aave-action-withdraw)
* [`aave hubs list`](#aave-hubs-list)
* [`aave reserve`](#aave-reserve)
* [`aave reserves list`](#aave-reserves-list)
* [`aave spokes list`](#aave-spokes-list)
* [`aave user borrows`](#aave-user-borrows)
* [`aave user positions`](#aave-user-positions)
* [`aave user summary`](#aave-user-summary)
* [`aave user supplies`](#aave-user-supplies)

## `aave action borrow`

Borrow ERC20 tokens from a reserve

```
USAGE
  $ aave action borrow --reserve-id <value> --amount <value> [--json] [-k <private-key>]

FLAGS
  -k, --private-key=<private-key>  Private key to sign transactions (overrides PRIVATE_KEY env var)
      --amount=<value>             (required) Amount of the token to borrow
      --reserve-id=<value>         (required) Reserve ID of the reserve to borrow from

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Borrow ERC20 tokens from a reserve
```

_See code: [src/commands/action/borrow.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/action/borrow.ts)_

## `aave action repay`

Repay ERC20 debt to a reserve

```
USAGE
  $ aave action repay --reserve-id <value> --amount <value> [--json] [-k <private-key>]

FLAGS
  -k, --private-key=<private-key>  Private key to sign transactions (overrides PRIVATE_KEY env var)
      --amount=<value>             (required) Amount of the token to repay
      --reserve-id=<value>         (required) Reserve ID of the reserve to repay

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Repay ERC20 debt to a reserve
```

_See code: [src/commands/action/repay.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/action/repay.ts)_

## `aave action supply`

Supply ERC20 tokens to a reserve

```
USAGE
  $ aave action supply --reserve-id <value> --amount <value> [--json] [-k <private-key>] [--enable-collateral]

FLAGS
  -k, --private-key=<private-key>  Private key to sign transactions (overrides PRIVATE_KEY env var)
      --amount=<value>             (required) Amount of the token to supply
      --enable-collateral          If provided, the supplied position is enabled as collateral
      --reserve-id=<value>         (required) Reserve ID of the reserve to supply

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Supply ERC20 tokens to a reserve
```

_See code: [src/commands/action/supply.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/action/supply.ts)_

## `aave action withdraw`

Withdraw ERC20 tokens from a reserve

```
USAGE
  $ aave action withdraw --reserve-id <value> --amount <value> [--json] [-k <private-key>]

FLAGS
  -k, --private-key=<private-key>  Private key to sign transactions (overrides PRIVATE_KEY env var)
      --amount=<value>             (required) Amount of the token to withdraw
      --reserve-id=<value>         (required) Reserve ID of the reserve to withdraw from

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Withdraw ERC20 tokens from a reserve
```

_See code: [src/commands/action/withdraw.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/action/withdraw.ts)_

## `aave hubs list`

List Aave v4 liquidity hubs

```
USAGE
  $ aave hubs list [--json] [-c <chain-id>]

FLAGS
  -c, --chain=<chain-id>  The chain ID (e.g. 1, 137, 42161)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List Aave v4 liquidity hubs
```

_See code: [src/commands/hubs/list.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/hubs/list.ts)_

## `aave reserve`

Show Aave v4 reserve details by reserve ID

```
USAGE
  $ aave reserve -i <value> [--json]

FLAGS
  -i, --id=<value>  (required) Reserve ID (e.g. SGVsbG8h…)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Show Aave v4 reserve details by reserve ID
```

_See code: [src/commands/reserve.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/reserve.ts)_

## `aave reserves list`

List Aave v4 reserves

```
USAGE
  $ aave reserves list [--json] [-s <spoke-id>] [-h <hub-id>] [--hub_address <evm-address> -c <chain-id>]

FLAGS
  -c, --chain_id=<chain-id>        The chain ID (e.g. 1, 137, 42161)
  -h, --hub_id=<hub-id>            The hub ID (e.g. SGVsbG8h…)
  -s, --spoke_id=<spoke-id>        The spoke ID (e.g. SGVsbG8h…)
      --hub_address=<evm-address>  The hub address (e.g. 0x123…)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List Aave v4 reserves
```

_See code: [src/commands/reserves/list.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/reserves/list.ts)_

## `aave spokes list`

List Aave v4 spokes

```
USAGE
  $ aave spokes list [--json] [-h <hub-id>] [--hub_address <evm-address> -c <chain-id>]

FLAGS
  -c, --chain_id=<chain-id>        The chain ID (e.g. 1, 137, 42161)
  -h, --hub_id=<hub-id>            The hub ID (e.g. SGVsbG8h…)
      --hub_address=<evm-address>  The hub address (e.g. 0x123…)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List Aave v4 spokes
```

_See code: [src/commands/spokes/list.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/spokes/list.ts)_

## `aave user borrows`

List user borrows for a specific chain

```
USAGE
  $ aave user borrows -c <chain-id> [--json] [--address <evm-address>]

FLAGS
  -c, --chain_id=<chain-id>    (required) Chain ID to query borrows from
      --address=<evm-address>  User address (defaults to PRIVATE_KEY wallet address)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List user borrows for a specific chain
```

_See code: [src/commands/user/borrows.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/user/borrows.ts)_

## `aave user positions`

List user positions across chains

```
USAGE
  $ aave user positions -c <chain-id> [--json] [--address <evm-address>]

FLAGS
  -c, --chain_id=<chain-id>    (required) Filter by chain ID
      --address=<evm-address>  User address (defaults to PRIVATE_KEY wallet address)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List user positions across chains
```

_See code: [src/commands/user/positions.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/user/positions.ts)_

## `aave user summary`

Show a user summary for a specific chain

```
USAGE
  $ aave user summary -c <chain-id> [--json] [--address <evm-address>]

FLAGS
  -c, --chain_id=<chain-id>    (required) Chain ID to query summary from
      --address=<evm-address>  User address (defaults to PRIVATE_KEY wallet address)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Show a user summary for a specific chain
```

_See code: [src/commands/user/summary.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/user/summary.ts)_

## `aave user supplies`

List user supplies for a specific chain

```
USAGE
  $ aave user supplies -c <chain-id> [--json] [--address <evm-address>]

FLAGS
  -c, --chain_id=<chain-id>    (required) Chain ID to query supplies from
      --address=<evm-address>  User address (defaults to PRIVATE_KEY wallet address)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List user supplies for a specific chain
```

_See code: [src/commands/user/supplies.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.4/src/commands/user/supplies.ts)_
<!-- commandsstop -->
