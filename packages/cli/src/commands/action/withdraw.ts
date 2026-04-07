import {
  bigDecimal,
  evmAddress,
  InvariantError,
  invariant,
  ok,
  type Reserve,
  ResultAsync,
  reserveId,
  type SendWithError,
  type TimeoutError,
  type TransactionReceipt,
  type UnexpectedError,
  type WithdrawRequest,
} from '@aave/client';
import { reserve, withdraw } from '@aave/client/actions';
import { sendWith, toViemChain } from '@aave/client/viem';
import { Flags } from '@oclif/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import * as common from '../../common.js';

export default class ActionWithdraw extends common.V4Command {
  static override description = 'Withdraw ERC20 tokens from a reserve';

  static override flags = {
    'reserve-id': Flags.string({
      required: true,
      description: 'Reserve ID of the reserve to withdraw from',
    }),
    amount: Flags.string({
      required: true,
      description: 'Amount of the token to withdraw',
    }),
    'private-key': common.privateKey({
      required: false,
    }),
  };

  private getWithdrawRequest(): ResultAsync<
    {
      request: WithdrawRequest;
      reserve: Reserve;
      amount: string;
      privateKey: `0x${string}`;
    },
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ActionWithdraw),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const privateKey = (flags['private-key'] ??
        process.env.PRIVATE_KEY) as `0x${string}`;
      invariant(
        privateKey,
        'Provide --private-key or PRIVATE_KEY environment variable',
      );

      const parsedReserveId = reserveId(flags['reserve-id']);
      const amount = flags.amount.trim();

      invariant(amount.length > 0, 'Amount cannot be empty');

      const account = privateKeyToAccount(privateKey);
      const sender = evmAddress(account.address);

      return reserve(this.client, {
        query: { reserveId: parsedReserveId },
        user: sender,
      }).andThen((reserveData) => {
        invariant(reserveData, `Reserve not found: ${flags['reserve-id']}`);

        return ok({
          request: {
            reserve: reserveData.id,
            amount: {
              erc20: {
                exact: bigDecimal(amount),
              },
            },
            sender,
          },
          reserve: reserveData,
          amount,
          privateKey,
        });
      });
    });
  }

  async run(): Promise<
    TransactionReceipt | InvariantError | SendWithError | TimeoutError
  > {
    const result = await this.getWithdrawRequest().andThen(
      ({ request, reserve, amount, privateKey }) => {
        const wallet = createWalletClient({
          account: privateKeyToAccount(privateKey),
          chain: toViemChain(reserve.chain),
          transport: http(reserve.chain.rpcUrl),
        });

        return withdraw(this.client, request)
          .andThen(sendWith(wallet))
          .andTee((txResult) =>
            this.log(`Withdraw transaction sent with hash: ${txResult.txHash}`),
          )
          .andThen(this.client.waitForTransaction)
          .map((txResult) => {
            this.display([
              ['Reserve ID', reserve.id],
              ['Amount', `${amount} - ${reserve.asset.underlying.info.symbol}`],
              ['Transaction Hash', txResult.txHash],
              ['Url', `${reserve.chain.explorerUrl}/tx/${txResult.txHash}`],
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
