import {
  type Chain,
  type ChainId,
  type EvmAddress,
  evmAddress,
  InvariantError,
  invariant,
  ok,
  okAsync,
  type RewardId,
  ResultAsync,
  type SendWithError,
  type TimeoutError,
  type TransactionReceipt,
  type UnexpectedError,
} from '@aave/client';
import { chain, claimRewards, userClaimableRewards } from '@aave/client/actions';
import { sendWith, toViemChain } from '@aave/client/viem';
import { Flags } from '@oclif/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import * as common from '../../common.js';

function parseRewardIds(ids: string | undefined): RewardId[] | null {
  if (!ids) {
    return null;
  }

  const parsed = ids
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0) as RewardId[];

  return parsed.length > 0 ? parsed : null;
}

export default class ActionClaimRewards extends common.V4Command {
  static override description = 'Claim rewards for the current wallet';

  static override flags = {
    ids: Flags.string({
      required: false,
      description:
        'Comma-separated reward IDs to claim (defaults to all claimable rewards for the wallet on this chain)',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Chain ID to claim rewards on',
    }),
    'private-key': common.privateKey({
      required: false,
    }),
  };

  private getClaimRequest(): ResultAsync<
    {
      ids: RewardId[];
      user: EvmAddress;
      chainId: ChainId;
      chain: Chain;
      privateKey: `0x${string}`;
    },
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ActionClaimRewards),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const privateKey = (flags['private-key'] ??
        process.env.PRIVATE_KEY) as `0x${string}`;
      invariant(
        privateKey,
        'Provide --private-key or PRIVATE_KEY environment variable',
      );

      const chainId = flags.chain_id as ChainId;
      invariant(chainId, 'You must provide a chain ID');

      const account = privateKeyToAccount(privateKey);
      const user = evmAddress(account.address);
      const explicitIds = parseRewardIds(flags.ids);

      const idsResult = explicitIds
        ? okAsync(explicitIds)
        : userClaimableRewards(this.client, {
            user,
            chainId,
          } as Parameters<typeof userClaimableRewards>[1]).andThen((rewards) => {
            invariant(
              rewards.length > 0,
              'No claimable rewards found for this wallet on this chain',
            );
            return ok(rewards.map((reward) => reward.id));
          });

      return idsResult.andThen((ids) =>
        chain(this.client, { chainId }).andThen((chainData) => {
          invariant(chainData, `Chain not found: ${chainId}`);

          return ok({
            ids,
            user,
            chainId,
            chain: chainData,
            privateKey,
          });
        }),
      );
    });
  }

  async run(): Promise<
    TransactionReceipt | InvariantError | SendWithError | TimeoutError
  > {
    const result = await this.getClaimRequest().andThen(
      ({ ids, user, chainId, chain, privateKey }) => {
        const wallet = createWalletClient({
          account: privateKeyToAccount(privateKey),
          chain: toViemChain(chain),
          transport: http(chain.rpcUrl),
        });

        return claimRewards(this.client, {
          ids,
          user,
          chainId,
        } as Parameters<typeof claimRewards>[1])
          .andThen(sendWith(wallet))
          .andTee((txResult) =>
            this.log(`Claim rewards transaction sent with hash: ${txResult.txHash}`),
          )
          .andThen(this.client.waitForTransaction)
          .map((txResult) => {
            this.display([
              ['Chain', `${chain.name} (${chain.chainId})`],
              ['User', user],
              ['Rewards Claimed', ids.length],
              ['Transaction Hash', txResult.txHash],
              ['Url', `${chain.explorerUrl}/tx/${txResult.txHash}`],
            ]);

            return txResult;
          });
      },
    );

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
