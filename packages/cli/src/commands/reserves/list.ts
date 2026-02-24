import {
  InvariantError,
  invariant,
  ok,
  type PercentNumber,
  type Reserve,
  type ReservesRequest,
  ResultAsync,
  type UnexpectedError,
} from '@aave/client';
import { reserves } from '@aave/client/actions';

import * as common from '../../common.js';

function formatApy(apy: PercentNumber, decimals = 4): string {
  return `${apy.normalized.toFixed(decimals)}%`;
}

export default class ListReserves extends common.V4Command {
  static override description = 'List Aave v4 reserves';

  static override flags = {
    spoke_id: common.spoke({
      required: false,
      relationships: [
        {
          type: 'none',
          flags: ['hub_id', 'chain_id', 'hub_address'],
        },
      ],
    }),
    hub_id: common.hub({
      required: false,
      relationships: [
        {
          type: 'none',
          flags: ['spoke_id', 'chain_id', 'hub_address'],
        },
      ],
    }),
    chain_id: common.chain({
      required: false,
      relationships: [
        {
          type: 'none',
          flags: ['spoke_id', 'hub_id'],
        },
      ],
    }),
    hub_address: common.address({
      name: 'hub_address',
      description: 'The hub address (e.g. 0x123…)',
      relationships: [
        {
          type: 'none',
          flags: ['spoke_id', 'hub_id'],
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
    { value: 'Asset' },
    { value: 'Symbol' },
    { value: 'Spoke' },
    { value: 'Chain' },
    { value: 'Supply APY' },
    { value: 'Borrow APY' },
    { value: 'Available Liquidity' },
    { value: 'Total Borrowed' },
    { value: 'Can Supply' },
    { value: 'Can Borrow' },
    { value: 'Collateral' },
    { value: 'ID' },
  ];

  private getReservesRequest(): ResultAsync<
    ReservesRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ListReserves),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      if (flags.spoke_id) {
        return ok({
          query: { spokeId: flags.spoke_id },
        });
      }

      if (flags.hub_id) {
        return ok({
          query: { hubId: flags.hub_id },
        });
      }

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

      if (flags.chain_id) {
        return ok({
          query: { chainIds: [flags.chain_id] },
        });
      }

      invariant(
        false,
        'You must provide --spoke_id, --hub_id, --chain_id, or (--hub_address and --chain_id)',
      );
    });
  }

  async run(): Promise<Reserve[]> {
    const result = await this.getReservesRequest().andThen((request) =>
      reserves(this.client, request),
    );

    if (result.isErr()) {
      this.error(result.error);
    }

    this.display(
      result.value.map((item) => [
        item.asset.underlying.info.name,
        item.asset.underlying.info.symbol,
        item.spoke.name,
        `${item.chain.name} (${item.chain.chainId})`,
        formatApy(item.summary.supplyApy),
        formatApy(item.summary.borrowApy),
        `${item.summary.supplied.exchange.symbol}${item.summary.supplied.exchange.value.toFixed(2)}`,
        `${item.summary.borrowed.exchange.symbol}${item.summary.borrowed.exchange.value.toFixed(2)}`,
        item.canSupply ? 'Yes' : 'No',
        item.canBorrow ? 'Yes' : 'No',
        item.canUseAsCollateral ? 'Yes' : 'No',
        item.id,
      ]),
    );

    return result.value;
  }
}
