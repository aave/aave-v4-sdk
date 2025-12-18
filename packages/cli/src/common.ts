import {
  AaveClient,
  type ChainId,
  chainId,
  type EvmAddress,
  evmAddress,
  type HubId,
  hubId,
  local,
  production,
  type SpokeId,
  spokeId,
  staging,
} from '@aave/client';
import { Command, Flags } from '@oclif/core';
import TtyTable from 'tty-table';



declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

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
}
