import {
  InvariantError,
  invariant,
  ok,
  type PercentNumber,
  type Reserve,
  type ReserveRequest,
  ResultAsync,
  reserveId,
  type UnexpectedError,
} from '@aave/client';
import { reserve } from '@aave/client/actions';
import { Flags } from '@oclif/core';

import * as common from '../common.js';

function formatApy(apy: PercentNumber, decimals = 4): string {
  return `${apy.normalized.toFixed(decimals)}%`;
}

export default class ReserveCommand extends common.V4Command {
  static override description = 'Show Aave v4 reserve details by reserve ID';

  static override flags = {
    id: Flags.string({
      char: 'i',
      required: true,
      description: 'Reserve ID (e.g. SGVsbG8h…)',
    }),
  };

  protected override headers = [{ value: 'Metric' }, { value: 'Value' }];

  private getReserveRequest(): ResultAsync<
    ReserveRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ReserveCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      invariant(flags.id, 'You must provide a reserve ID');

      return ok({
        query: { reserveId: reserveId(flags.id) },
      });
    });
  }

  async run(): Promise<Reserve | InvariantError | UnexpectedError> {
    const result = await this.getReserveRequest()
      .andThen((request) => reserve(this.client, request))
      .andThen((data) => {
        invariant(data, 'Reserve not found');

        this.display([
          ['Asset', data.asset.underlying.info.name],
          ['Symbol', data.asset.underlying.info.symbol],
          ['Spoke', data.spoke.name],
          ['Chain', `${data.chain.name} (${data.chain.chainId})`],
          ['Supply APY', formatApy(data.summary.supplyApy)],
          ['Borrow APY', formatApy(data.summary.borrowApy)],
          [
            'Available Liquidity',
            `${data.summary.supplied.exchange.symbol}${data.summary.supplied.exchange.value.toFixed(2)}`,
          ],
          [
            'Total Borrowed',
            `${data.summary.borrowed.exchange.symbol}${data.summary.borrowed.exchange.value.toFixed(2)}`,
          ],
          ['Can Supply', data.canSupply ? 'Yes' : 'No'],
          ['Can Borrow', data.canBorrow ? 'Yes' : 'No'],
          ['Collateral', data.canUseAsCollateral ? 'Yes' : 'No'],
          ['ID', data.id],
        ]);

        return ok(data);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
