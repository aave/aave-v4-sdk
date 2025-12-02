import {
  AaveClient,
  type HubsRequest,
  InvariantError,
  ok,
  ResultAsync,
  type UnexpectedError,
} from '@aave/client';
import { chains, hubs } from '@aave/client/actions';
import { Command } from '@oclif/core';
import TtyTable from 'tty-table';

import * as common from '../../common.js';

export default class ListHubs extends Command {
  static override description = 'List Aave v4 liquidity hubs';

  static override flags = {
    chain: common.chain(),
  };

  client = AaveClient.create();

  private getHubsRequest(): ResultAsync<
    HubsRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ListHubs),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      if (flags.chain) {
        return ok({
          query: {
            chainIds: [flags.chain],
          },
        });
      }

      return chains(this.client).andThen((items) =>
        ok({
          query: {
            chainIds: items.map((item) => item.chainId),
          },
        }),
      );
    });
  }

  async run(): Promise<void> {
    const result = await this.getHubsRequest().andThen((request) =>
      hubs(this.client, request),
    );

    if (result.isErr()) {
      this.error(result.error);
    }

    const headers = [
      { value: 'Hub' },
      { value: 'Address' },
      { value: 'Chain' },
      { value: 'ID' },
    ];
    const rows = result.value.map((item) => [
      item.name,
      item.address,
      `${item.chain.name} (id=${item.chain.chainId})`,
      `${item.id}`,
    ]);

    const out = TtyTable(headers, rows).render();
    this.log(out);
  }
}
