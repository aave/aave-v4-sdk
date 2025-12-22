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
@aave/cli/4.1.0-next.3 darwin-arm64 node-v22.17.0
$ aave --help [COMMAND]
USAGE
  $ aave COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`aave hubs list`](#aave-hubs-list)
* [`aave reserves list`](#aave-reserves-list)
* [`aave spokes list`](#aave-spokes-list)

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

_See code: [src/commands/hubs/list.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.0-next.3/src/commands/hubs/list.ts)_

## `aave reserves list`

List Aave v4 reserves

```
USAGE
  $ aave reserves list [-s <spoke-id>] [-h <hub-id>] [--hub_address <evm-address> -c <chain-id>]

FLAGS
  -c, --chain_id=<chain-id>        The chain ID (e.g. 1, 137, 42161)
  -h, --hub_id=<hub-id>            The hub ID (e.g. SGVsbG8h…)
  -s, --spoke_id=<spoke-id>        The spoke ID (e.g. SGVsbG8h…)
      --hub_address=<evm-address>  The hub address (e.g. 0x123…)

DESCRIPTION
  List Aave v4 reserves

EXAMPLES
  $ aave reserves list --spoke_id MTIzNDU2Nzg5OjoweEJh...
  $ aave reserves list --hub_id MTIzNDU2Nzg5OjoweGFEOTA1...
  $ aave reserves list --chain_id 123456789
```

_See code: [src/commands/reserves/list.ts](https://github.com/aave/aave-v4-sdk/blob/v4.0.0/src/commands/reserves/list.ts)_

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

_See code: [src/commands/spokes/list.ts](https://github.com/aave/aave-v4-sdk/blob/v4.1.0-next.3/src/commands/spokes/list.ts)_
<!-- commandsstop -->
