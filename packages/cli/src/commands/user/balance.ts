import {
  type ChainId,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  type PercentNumber,
  ResultAsync,
  type UnexpectedError,
  type UserBalance,
  type UserBalancesRequest,
} from '@aave/client';
import { userBalances } from '@aave/client/actions';

import * as common from '../../common.js';

function formatPercent(value: PercentNumber | null): string {
  return value ? `${value.normalized.toFixed(4)}%` : 'N/A';
}

export default class UserBalanceCommand extends common.V4Command {
  static override description =
    'List user token balances that can be used in Aave v4';

  static override flags = {
    address: common.address({
      required: false,
      description: 'User address (defaults to PRIVATE_KEY wallet address)',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Chain ID to query balances from',
    }),
  };

  override headers = [
    { value: 'Asset' },
    { value: 'Symbol' },
    { value: 'Balance' },
    { value: 'Exchange' },
    { value: 'Best Supply APY' },
    { value: 'Best Borrow APY' },
  ];

  private getBalancesRequest(): ResultAsync<
    UserBalancesRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserBalanceCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const user = common.userAddressFromFlagOrEnv(
        flags.address as EvmAddress | undefined,
      );
      const chainId = flags.chain_id as ChainId;

      invariant(chainId, 'You must provide a chain ID');

      return ok({
        user,
        filter: {
          chains: {
            chainIds: [chainId],
          },
        },
      });
    });
  }

  async run(): Promise<UserBalance[] | InvariantError | UnexpectedError> {
    const result = await this.getBalancesRequest()
      .andThen((request) => userBalances(this.client, request))
      .andThen((balances) => {
        if (balances.length === 0) {
          this.log('No balances found for this user.');
          return ok(balances);
        }

        this.display(
          balances.map((item) => [
            item.info.name,
            item.info.symbol,
            item.totalAmount.value.toFixed(6),
            `${item.exchange.symbol}${item.exchange.value.toFixed(2)}`,
            formatPercent(item.highestSupplyApy),
            formatPercent(item.highestBorrowApy),
          ]),
        );

        return ok(balances);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
