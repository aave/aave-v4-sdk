import {
  AaveClient,
  type BigDecimal,
  bigDecimal,
  type ChainId,
  chainId,
  type EvmAddress,
  evmAddress,
  type HubId,
  hubId,
  type ReserveId,
  reserveId,
  staging,
} from '@aave/client';
import { Command, Flags } from '@oclif/core';
import TtyTable from 'tty-table';

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

export const reserve = Flags.custom<ReserveId>({
  char: 'r',
  name: 'reserve',
  description: 'The reserve ID (e.g. SGVsbG8h…)',
  helpValue: '<reserve-id>',
  parse: async (input) => reserveId(input),
});

export const address = Flags.custom<EvmAddress>({
  parse: async (input) => evmAddress(input),
  helpValue: '<evm-address>',
});

export const decimal = Flags.custom<BigDecimal>({
  parse: async (input) => bigDecimal(input),
  helpValue: '<human-readable-decimal>',
});

export abstract class V4Command extends Command {
  protected headers: TtyTable.Header[] = [];

  public static enableJsonFlag = true;

  protected client = AaveClient.create({
    environment: staging,
  });

  protected display(rows: unknown[]) {
    const out = TtyTable(this.headers, rows).render();
    this.log(out);
  }
}
