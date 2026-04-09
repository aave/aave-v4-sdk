import {
  type ChainId,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  ResultAsync,
  type UnexpectedError,
  type UserBorrowItem,
  type UserBorrowsRequest,
} from '@aave/client';
import { userBorrows } from '@aave/client/actions';

import * as common from '../../common.js';

export default class UserBorrowsCommand extends common.V4Command {
  static override description = 'List user borrows for a specific chain';

  static override flags = {
    address: common.address({
      required: false,
      description: 'User address (defaults to PRIVATE_KEY wallet address)',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Chain ID to query borrows from',
    }),
  };

  override headers = [
    { value: 'Asset' },
    { value: 'Borrowed' },
    { value: 'Interest Owed' },
    { value: 'Total Debt' },
    { value: 'Borrow APY' },
    { value: 'Spoke' },
  ];

  private getBorrowsRequest(): ResultAsync<
    UserBorrowsRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserBorrowsCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const user = common.userAddressFromFlagOrEnv(
        flags.address as EvmAddress | undefined,
      );
      const chainId = flags.chain_id as ChainId;

      invariant(chainId, 'You must provide a chain ID');

      return ok({
        query: {
          userChains: {
            user,
            chainIds: [chainId],
          },
        },
      });
    });
  }

  async run(): Promise<UserBorrowItem[] | InvariantError | UnexpectedError> {
    const result = await this.getBorrowsRequest()
      .andThen((request) => userBorrows(this.client, request))
      .andThen((borrows) => {
        if (borrows.length === 0) {
          this.log('No borrows found for this user.');
          return ok(borrows);
        }

        this.display(
          borrows.map((item) => [
            item.principal.token.info.name,
            `${item.principal.amount.value.toFixed(4)} `,
            `${item.interest.amount.value.toFixed(4)} `,
            `${(item.debt.amount.value).toFixed(4)} `,
            `${item.reserve.summary.borrowApy.normalized.toFixed(4)}%`,
            item.reserve.spoke.name,
          ]),
        );
        return ok(borrows);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
