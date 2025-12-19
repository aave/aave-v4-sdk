import {
  InvariantError,
  invariant,
  ok,
  ResultAsync,
  type Spoke,
  type SpokesRequest,
} from '@aave/client';
import { spokes } from '@aave/client/actions';

import * as common from '../../common.js';

export default class ListSpokes extends common.V4Command {
  static override description = 'List Aave v4 spokes';

  static override flags = {
    hub_id: common.hub({
      relationships: [
        {
          type: 'none',
          flags: ['chain_id', 'hub_address'],
        },
      ],
    }),
    chain_id: common.chain({
      required: false,
      relationships: [
        {
          type: 'none',
          flags: ['hub_id'],
        },
      ],
    }),
    hub_address: common.address({
      name: 'hub_address',
      description: 'The hub address (e.g. 0x123…)',
      relationships: [
        {
          type: 'none',
          flags: ['hub_id'],
        },
        {
          type: 'all',
          flags: ['chain_id'],
        },
      ],
      dependsOn: ['chain_id'],
    }),
  };

  protected override headers = [
    { value: 'Spoke' },
    { value: 'Address' },
    { value: 'Chain' },
    { value: 'ID' },
  ];

  private getSpokesRequest(): ResultAsync<SpokesRequest, InvariantError> {
    return ResultAsync.fromPromise(
      this.parse(ListSpokes),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      if (flags.chain_id && flags.hub_address) {
        return ok({
          query: {
            hub: {
              address: flags.hub_address,
              chainId: flags.chain_id,
            },
          },
        });
      }

      invariant(
        flags.hub_id,
        'You must provide a <hub> or <hub_address> and <chain>',
      );

      return ok({
        query: {
          hubId: flags.hub_id,
        },
      });
    });
  }

  async run(): Promise<Spoke[]> {
    const result = await this.getSpokesRequest().andThen((request) =>
      spokes(this.client, request),
    );

    if (result.isErr()) {
      this.error(result.error);
    }

    this.display(
      result.value.map((item) => [
        item.name,
        item.address,
        `${item.chain.name} (id=${item.chain.chainId})`,
        item.id,
      ]),
    );

    return result.value;
  }
}
