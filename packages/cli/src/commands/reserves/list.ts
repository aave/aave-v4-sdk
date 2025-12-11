import {
  InvariantError,
  ok,
  ResultAsync,
  type Reserve,
  type ReservesRequest,
  type UnexpectedError,
  spokeId,
  type SpokeId,
} from '@aave/client';
import { reserves } from '@aave/client/actions';

import * as common from '../../common.js';

export default class ListReserves extends common.V4Command {
  static override description = 'List Aave v4 reserves';

  static override flags = {
    spoke_id: common.spoke(),
    // TODO: Add more flexible query options later:
    // hub_id: common.hub(),
    // chain_id: common.chain(),
    // hub_address: common.address(),
  };

  protected override headers = [
    { value: 'Asset' },
    { value: 'Symbol' },
    { value: 'Spoke' },
    { value: 'Chain' },
    { value: 'Supply APY' },
    { value: 'Borrow APY' },
    { value: 'ID' },
    // TODO: You can add more columns from Reserve type:
    // - Available Liquidity: item.summary.supplied.amount (or formatted)
    // - Borrowed: item.summary.borrowed.amount
    // - Can Borrow: item.canBorrow
    // - Can Supply: item.canSupply
  ];

  private getReservesRequest(): ResultAsync<
    ReservesRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ListReserves),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      if (!flags.spoke_id) {
        return ResultAsync.fromSafePromise(
          Promise.reject(new InvariantError('--spoke_id is required')),
        );
      }
      
      return ok({
        query: { spokeId: flags.spoke_id },
      });

      // TODO: Add more flexible query options later:
      // if (flags.hub_id) {
      //   return ok({ query: { hubId: flags.hub_id } });
      // }
      // if (flags.chain_id) {
      //   return ok({ query: { chainIds: [flags.chain_id] } });
      // }
      // if (flags.hub_address && flags.chain_id) {
      //   return ok({
      //     query: {
      //       hub: {
      //         address: flags.hub_address,
      //         chainId: flags.chain_id,
      //       },
      //     },
      //   });
      // }
    });
  }

  async run(): Promise<Reserve[]> {
    const result = await this.getReservesRequest().andThen((request) =>
      reserves(this.client, request),
    );

    if (result.isErr()) {
      this.error(result.error);
    }

    // Format the output - map each reserve to an array of column values
    this.display(
      result.value.map((item) => [
        item.asset.underlying.info.name,
        item.asset.underlying.info.symbol,
        item.spoke.name,
        `${item.chain.name} (${item.chain.chainId})`,
        `${item.summary.supplyApy.normalized}%`,
        `${item.summary.borrowApy.normalized}%`,
        item.id,
      ]),
    );

    return result.value;
  }
}
