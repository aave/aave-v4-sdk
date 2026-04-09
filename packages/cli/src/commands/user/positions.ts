import {
  type ChainId,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  ResultAsync,
  type UnexpectedError,
  type UserPosition,
  type UserPositionsRequest,
} from '@aave/client';
import { userPositions } from '@aave/client/actions';

import * as common from '../../common.js';

export default class UserPositionsCommand extends common.V4Command {
  static override description = 'List user positions across chains';

  static override flags = {
    address: common.address({
      required: false,
      description: 'User address (defaults to PRIVATE_KEY wallet address)',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Filter by chain ID',
    }),
  };

  override headers = [
    { value: 'Position ID' },
    { value: 'Spoke' },
    { value: 'Chain' },
    { value: 'Total Supplied' },
    { value: 'Total Borrowed' },
    { value: 'Health Factor' },
    { value: 'Collateral Enabled' },
  ];

  private getPositionsRequest(): ResultAsync<
    UserPositionsRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserPositionsCommand),
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
          chainIds: [chainId],
        },
      });
    });
  }

  async run(): Promise<UserPosition[] | InvariantError | UnexpectedError> {
    const result = await this.getPositionsRequest()
      .andThen((request) => userPositions(this.client, request))
      .andThen((positions) => {
        if (positions.length === 0) {
          this.log('No positions found for this user');
          return ok(positions);
        }

        this.display(
          positions.map((item) => [
            item.id,
            item.spoke.name,
            `${item.spoke.chain.name} (id=${item.spoke.chain.chainId})`,
            `${item.totalSupplied.current.symbol}${item.totalSupplied.current.value.toFixed(2)}`,
            `${item.totalDebt.current.symbol}${item.totalDebt.current.value.toFixed(2)}`,
            item.healthFactor.current?.toFixed(2) ?? 'N/A',
            Number(item.totalCollateral.current.value.toFixed(0)) > 0
              ? 'Yes'
              : 'No',
          ]),
        );
        return ok(positions);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
