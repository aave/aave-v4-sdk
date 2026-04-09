import {
  AaveClient,
  type ChainId,
  chainId,
  type EvmAddress,
  evmAddress,
  type HubId,
  hubId,
  invariant,
  production,
  type SpokeId,
  spokeId,
  staging,
} from '@aave/client';
import { Command, Flags } from '@oclif/core';
import TtyTable from 'tty-table';
import { privateKeyToAccount } from 'viem/accounts';

export const chain = Flags.custom<ChainId>({
  char: 'c',
  name: 'chain',
  description: 'The chain ID (e.g. 1, 137, 42161)',
  helpValue: '<chain-id>',
  parse: async (input: string) => chainId(Number(input)),
});

export const hub = Flags.custom<HubId>({
  char: 'h',
  name: 'hub',
  description: 'The hub ID (e.g. SGVsbG8h…)',
  helpValue: '<hub-id>',
  parse: async (input) => hubId(input),
});

export const spoke = Flags.custom<SpokeId>({
  char: 's',
  name: 'spoke',
  description: 'The spoke ID (e.g. SGVsbG8h…)',
  helpValue: '<spoke-id>',
  parse: async (input) => spokeId(input),
});

export const address = Flags.custom<EvmAddress>({
  parse: async (input) => evmAddress(input),
  helpValue: '<evm-address>',
});

export const privateKey = Flags.custom<`0x${string}`>({
  char: 'k',
  name: 'private-key',
  description:
    'Private key to sign transactions (overrides PRIVATE_KEY env var)',
  parse: async (input) =>
    (input.startsWith('0x') ? input : `0x${input}`) as `0x${string}`,
  helpValue: '<private-key>',
});

export function userAddressFromFlagOrEnv(user?: EvmAddress): EvmAddress {
  if (user) {
    return user;
  }

  const privateKey = process.env.PRIVATE_KEY;
  invariant(
    privateKey,
    'Provide --address or set PRIVATE_KEY environment variable',
  );

  const normalizedPrivateKey = privateKey.startsWith('0x')
    ? privateKey
    : `0x${privateKey}`;

  const account = privateKeyToAccount(normalizedPrivateKey as `0x${string}`);
  return evmAddress(account.address);
}

function convertBigIntsToStrings(obj: unknown): unknown {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings);
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBigIntsToStrings(value);
    }
    return result;
  }

  return obj;
}

export abstract class V4Command extends Command {
  protected headers: TtyTable.Header[] = [];

  public static enableJsonFlag = true;

  static baseFlags = {
    staging: Flags.boolean({
      hidden: true,
      description: 'Use staging environment',
      default: false,
    }),
  };

  protected client!: AaveClient;

  async init(): Promise<void> {
    await super.init();
    const { flags } = await this.parse(this.constructor as typeof V4Command);
    const environment = flags.staging ? staging : production;
    this.client = AaveClient.create({ environment });
  }

  protected display(rows: unknown[]) {
    const out = TtyTable(this.headers, rows).render();
    this.log(out);
  }

  protected toSuccessJson(result: unknown): unknown {
    return convertBigIntsToStrings(result);
  }
}
