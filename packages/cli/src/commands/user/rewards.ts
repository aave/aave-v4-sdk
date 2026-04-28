import {
  type ChainId,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  ResultAsync,
  type UnexpectedError,
  type UserClaimableReward,
} from '@aave/client';
import { userClaimableRewards } from '@aave/client/actions';

import * as common from '../../common.js';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default class UserRewardsCommand extends common.V4Command {
  static override description =
    'List claimable rewards for a user on a specific chain';

  static override flags = {
    address: common.address({
      required: false,
      description: 'User address (defaults to PRIVATE_KEY wallet address)',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Chain ID to query rewards from',
    }),
  };

  protected override headers = [
    { value: 'Reward ID' },
    { value: 'Token' },
    { value: 'Claimable' },
    { value: 'Value' },
    { value: 'Claim Until' },
  ];

  private getRequest(): ResultAsync<
    {
      user: EvmAddress;
      chainId: ChainId;
    },
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserRewardsCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const user = common.userAddressFromFlagOrEnv(
        flags.address as EvmAddress | undefined,
      );
      const chainId = flags.chain_id as ChainId;

      invariant(chainId, 'You must provide a chain ID');

      return ok({ user, chainId });
    });
  }

  async run(): Promise<
    UserClaimableReward[] | InvariantError | UnexpectedError
  > {
    const result = await this.getRequest()
      .andThen(({ user, chainId }) =>
        userClaimableRewards(this.client, {
          user,
          chainId,
        } as Parameters<typeof userClaimableRewards>[1]),
      )
      .andThen((rewards) => {
        if (rewards.length === 0) {
          this.log('No claimable rewards found for this user.');
          return ok(rewards);
        }

        this.display(
          rewards.map((reward) => [
            reward.id,
            reward.claimable.token.info.symbol,
            `${reward.claimable.amount.value.toFixed(6)} ${reward.claimable.token.info.symbol}`,
            `${reward.claimable.exchange.symbol}${reward.claimable.exchange.value.toFixed(2)}`,
            formatDate(reward.claimUntil),
          ]),
        );

        return ok(rewards);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
