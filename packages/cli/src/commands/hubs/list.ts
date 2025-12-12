import {
  ChainsFilter,
  type Hub,
  type HubsRequest,
  InvariantError,
  ok,
  ResultAsync,
  type UnexpectedError,
} from '@aave/client';
import { chains, hubs } from '@aave/client/actions';

import * as common from '../../common.js';

export default class ListHubs extends common.V4Command {
  static override description = 'List Aave v4 liquidity hubs';

  static override flags = {
    chain: common.chain(),
  };

  override headers = [
    { value: 'Hub' },
    { value: 'Address' },
    { value: 'Chain' },
    { value: 'ID' },
  ];

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

      return chains(this.client, {
        query: { filter: ChainsFilter.ALL },
      }).andThen((items) =>
        ok({
          query: {
            chainIds: items.map((item) => item.chainId),
          },
        }),
      );
    });
  }

  async run(): Promise<Hub[]> {
    const result = await this.getHubsRequest().andThen((request) =>
      hubs(this.client, request),
    );

    if (result.isErr()) {
      this.error(result.error);
    }

    this.display(
      result.value.map((item) => [
        item.name,
        item.address,
        `${item.chain.name} (id=${item.chain.chainId})`,
        `${item.id}`,
      ]),
    );

    return result.value;
  }
}
