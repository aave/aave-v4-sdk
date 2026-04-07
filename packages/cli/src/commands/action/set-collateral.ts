import {
  evmAddress,
  InvariantError,
  invariant,
  ok,
  type Reserve,
  ResultAsync,
  reserveId,
  type SendWithError,
  type SetUserSuppliesAsCollateralRequest,
  type TimeoutError,
  type TransactionReceipt,
  type UnexpectedError,
} from '@aave/client';
import { reserve, setUserSuppliesAsCollateral } from '@aave/client/actions';
import { sendWith, toViemChain } from '@aave/client/viem';
import { Flags } from '@oclif/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import * as common from '../../common.js';

export default class ActionSetCollateral extends common.V4Command {
  static override description =
    'Enable or disable a supplied reserve as collateral';

  static override flags = {
    'reserve-id': Flags.string({
      required: true,
      description: 'Reserve ID of the supplied position to update',
    }),
    enable: Flags.boolean({
      required: false,
      default: false,
      description:
        'Enable the supplied position as collateral (default behavior)',
    }),
    disable: Flags.boolean({
      required: false,
      default: false,
      description: 'Disable the supplied position as collateral',
    }),
    'private-key': common.privateKey({
      required: false,
    }),
  };

  private getSetCollateralRequest(): ResultAsync<
    {
      request: SetUserSuppliesAsCollateralRequest;
      reserve: Reserve;
      enableCollateral: boolean;
      privateKey: `0x${string}`;
    },
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(ActionSetCollateral),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const privateKey = (flags['private-key'] ??
        process.env.PRIVATE_KEY) as `0x${string}`;
      invariant(
        privateKey,
        'Provide --private-key or PRIVATE_KEY environment variable',
      );

      const parsedReserveId = reserveId(flags['reserve-id']);
      const enable = flags.enable;
      const disable = flags.disable;

      invariant(
        !(enable && disable),
        'Provide at most one of --enable or --disable',
      );

      const enableCollateral = !disable;

      const account = privateKeyToAccount(privateKey);
      const sender = evmAddress(account.address);

      return reserve(this.client, {
        query: { reserveId: parsedReserveId },
        user: sender,
      }).andThen((reserveData) => {
        invariant(reserveData, `Reserve not found: ${flags['reserve-id']}`);

        return ok({
          request: {
            changes: [
              {
                reserve: reserveData.id,
                enableCollateral,
              },
            ],
            sender,
          },
          reserve: reserveData,
          enableCollateral,
          privateKey,
        });
      });
    });
  }

  async run(): Promise<
    TransactionReceipt | InvariantError | SendWithError | TimeoutError
  > {
    const result = await this.getSetCollateralRequest().andThen(
      ({ request, reserve, enableCollateral, privateKey }) => {
        const wallet = createWalletClient({
          account: privateKeyToAccount(privateKey),
          chain: toViemChain(reserve.chain),
          transport: http(reserve.chain.rpcUrl),
        });

        return setUserSuppliesAsCollateral(this.client, request)
          .andThen(sendWith(wallet))
          .andTee((txResult) =>
            this.log(
              `Set collateral transaction sent with hash: ${txResult.txHash}`,
            ),
          )
          .andThen(this.client.waitForTransaction)
          .map((txResult) => {
            this.display([
              ['Reserve ID', reserve.id],
              [
                'Action',
                enableCollateral ? 'Enable collateral' : 'Disable collateral',
              ],
              ['Asset', reserve.asset.underlying.info.symbol],
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
