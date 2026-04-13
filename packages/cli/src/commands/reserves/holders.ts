import {
  invariant,
  ok,
  type PaginatedReserveHoldersResult,
  ReserveHoldersFilter,
  ResultAsync,
  reserveId,
  type UnexpectedError,
} from '@aave/client';
import { reserveHolders } from '@aave/client/actions';
import { Flags } from '@oclif/core';

import * as common from '../../common.js';

export default class ListReserveHolders extends common.V4Command {
  static override description = 'List top holders for a reserve';

  static override flags = {
    id: Flags.string({
      char: 'i',
      required: true,
      description: 'Reserve ID (e.g. SGVsbG8h…)',
    }),
    filter: Flags.string({
      char: 'f',
      options: ['SUPPLIED', 'BORROWED'],
      default: 'SUPPLIED',
      description: 'Filter by SUPPLIED or BORROWED holders',
    }),
  };

  protected override headers = [
    { value: 'Address' },
    { value: 'Amount' },
    { value: 'Value (USD)' },
    { value: 'Weight' },
  ];

  async run(): Promise<PaginatedReserveHoldersResult | UnexpectedError> {
    const result = await ResultAsync.fromPromise(
      this.parse(ListReserveHolders),
      (e) => e as UnexpectedError,
    )
      .andThen(({ flags }) => {
        invariant(flags.id, 'You must provide a reserve ID');

        const filter =
          flags.filter === 'BORROWED'
            ? ReserveHoldersFilter.Borrowed
            : ReserveHoldersFilter.Supplied;

        return reserveHolders(this.client, {
          reserve: { reserveId: reserveId(flags.id) },
          filter,
        });
      })
      .andThen((data) => {
        this.display(
          data.items.map((holder) => [
            holder.address,
            `${holder.amount.amount.value.toFixed(4)} ${holder.amount.token.info.symbol}`,
            `$${holder.amount.exchange.value.toFixed(2)}`,
            `${holder.weight.normalized.toFixed(4)}%`,
          ]),
        );

        if (data.pageInfo.next) {
          this.log(`\nNext cursor: ${data.pageInfo.next}`);
        }

        return ok(data);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
