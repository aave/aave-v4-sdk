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
@aave/cli/0.0.0 darwin-arm64 node-v22.17.0
$ aave --help [COMMAND]
USAGE
  $ aave COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
- [@aave/cli](#aavecli)
- [Usage](#usage)
- [Commands](#commands)
  - [`aave hello PERSON`](#aave-hello-person)
  - [`aave hello world`](#aave-hello-world)
  - [`aave help [COMMAND]`](#aave-help-command)
  - [`aave plugins`](#aave-plugins)
  - [`aave plugins add PLUGIN`](#aave-plugins-add-plugin)
  - [`aave plugins:inspect PLUGIN...`](#aave-pluginsinspect-plugin)
  - [`aave plugins install PLUGIN`](#aave-plugins-install-plugin)
  - [`aave plugins link PATH`](#aave-plugins-link-path)
  - [`aave plugins remove [PLUGIN]`](#aave-plugins-remove-plugin)
  - [`aave plugins reset`](#aave-plugins-reset)
  - [`aave plugins uninstall [PLUGIN]`](#aave-plugins-uninstall-plugin)
  - [`aave plugins unlink [PLUGIN]`](#aave-plugins-unlink-plugin)
  - [`aave plugins update`](#aave-plugins-update)

## `aave hello PERSON`

Say hello

```
USAGE
  $ aave hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ aave hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/packages/cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `aave hello world`

Say hello world

```
USAGE
  $ aave hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ aave hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/packages/cli/blob/v0.0.0/src/commands/hello/world.ts)_

## `aave help [COMMAND]`

Display help for aave.

```
USAGE
  $ aave help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for aave.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `aave plugins`

List installed plugins.

```
USAGE
  $ aave plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ aave plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/index.ts)_

## `aave plugins add PLUGIN`

Installs a plugin into aave.

```
USAGE
  $ aave plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into aave.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the AAVE_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the AAVE_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ aave plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ aave plugins add myplugin

  Install a plugin from a github url.

    $ aave plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ aave plugins add someuser/someplugin
```

## `aave plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ aave plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ aave plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/inspect.ts)_

## `aave plugins install PLUGIN`

Installs a plugin into aave.

```
USAGE
  $ aave plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into aave.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the AAVE_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the AAVE_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ aave plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ aave plugins install myplugin

  Install a plugin from a github url.

    $ aave plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ aave plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/install.ts)_

## `aave plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ aave plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ aave plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/link.ts)_

## `aave plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ aave plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ aave plugins unlink
  $ aave plugins remove

EXAMPLES
  $ aave plugins remove myplugin
```

## `aave plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ aave plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/reset.ts)_

## `aave plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ aave plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ aave plugins unlink
  $ aave plugins remove

EXAMPLES
  $ aave plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/uninstall.ts)_

## `aave plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ aave plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ aave plugins unlink
  $ aave plugins remove

EXAMPLES
  $ aave plugins unlink myplugin
```

## `aave plugins update`

Update installed plugins.

```
USAGE
  $ aave plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/update.ts)_
<!-- commandsstop -->
