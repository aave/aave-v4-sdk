import {
  type ChainId,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  ResultAsync,
  type UnexpectedError,
  type UserSuppliesRequest,
  type UserSupplyItem,
} from '@aave/client';
import { userSupplies } from '@aave/client/actions';

import * as common from '../../common.js';

export default class UserSuppliesCommand extends common.V4Command {
  static override description = 'List user supplies for a specific chain';

  static override flags = {
    address: common.address({
      required: false,
      description: 'User address (defaults to PRIVATE_KEY wallet address)',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Chain ID to query supplies from',
    }),
  };

  override headers = [
    { value: 'Asset' },
    { value: 'Supplied' },
    { value: 'Interest Earned' },
    { value: 'Withdrawable' },
    { value: 'APY' },
    { value: 'Collateral' },
    { value: 'Spoke' },
  ];

  private getSuppliesRequest(): ResultAsync<
    UserSuppliesRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserSuppliesCommand),
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

  async run(): Promise<UserSupplyItem[] | InvariantError | UnexpectedError> {
    const result = await this.getSuppliesRequest()
      .andThen((request) => userSupplies(this.client, request))
      .andThen((supplies) => {
        if (supplies.length === 0) {
          this.log('No supplies found for this user');
          return ok(supplies);
        }

        this.display(
          supplies.map((item) => [
            `${item.reserve.asset.underlying.info.name} (${item.reserve.asset.underlying.info.symbol})`,
            `${item.principal.amount.value.toFixed(4)} `,
            `${item.interest.amount.value.toFixed(4)} `,
            `${item.withdrawable.amount.value.toFixed(4)}`,
            `${item.reserve.summary.supplyApy.normalized.toFixed(4)}%`,
            item.isCollateral ? 'Yes' : 'No',
            item.reserve.spoke.name,
          ]),
        );
        return ok(supplies);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
