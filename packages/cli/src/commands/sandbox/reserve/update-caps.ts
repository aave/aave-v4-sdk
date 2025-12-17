import {
  type BigDecimal,
  err,
  InvariantError,
  ok,
  type Reserve,
  type ReserveRequest,
  ResultAsync,
  RoundingMode,
  type TxHash,
  txHash,
} from '@aave/client';
import { reserve } from '@aave/client/actions';
import { createNewWallet } from '@aave/client/testing';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { writeContract } from 'viem/actions';
import * as common from '../../../common.js';

export default class UpdateCaps extends common.V4Command {
  static override description = 'Update the caps for a specific reserve';

  static override flags = {
    reserve: common.reserve({
      required: true,
      relationships: [
        {
          type: 'some',
          flags: ['supply_cap', 'borrow_cap'],
        },
      ],
    }),
    supply_cap: common.decimal({
      required: false,
      name: 'supply_cap',
      description: 'The new supply cap for the reserve (e.g. 1000.00)',
    }),
    borrow_cap: common.decimal({
      name: 'borrow_cap',
      description: 'The new borrow cap for the reserve (e.g. 1000.00)',
    }),
  };

  override headers = [{ value: 'Reserve' }, { value: 'TxHash' }];

  private updateSpokeConfigABI = [
    {
      type: 'function',
      name: 'updateSpokeConfig',
      stateMutability: 'nonpayable',
      constant: false,
      inputs: [
        { type: 'uint256', name: 'assetId', simpleType: 'uint' },
        { type: 'address', name: 'spoke', simpleType: 'address' },
        {
          type: 'tuple',
          name: 'config',
          simpleType: 'tuple',
          components: [
            { type: 'uint40', name: 'addCap', simpleType: 'uint' },
            { type: 'uint40', name: 'drawCap', simpleType: 'uint' },
            {
              type: 'uint24',
              name: 'riskPremiumThreshold',
              simpleType: 'uint',
            },
            { type: 'bool', name: 'active', simpleType: 'bool' },
            { type: 'bool', name: 'paused', simpleType: 'bool' },
          ],
        },
      ],
      outputs: undefined,
    },
  ] as const;

  private getReserveRequest(): ResultAsync<ReserveRequest, InvariantError> {
    return ResultAsync.fromPromise(
      this.parse(UpdateCaps),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      if (flags.reserve) {
        return ok({
          query: {
            reserveId: flags.reserve,
          },
        });
      }

      return err(
        new InvariantError(
          'You must provide a <reserve> and either <supply_cap> or <borrow_cap>',
        ),
      );
    });
  }

  private sendUpdateCapsTransaction(
    wallet: WalletClient<Transport, Chain, Account>,
    reserveInfo: Reserve,
    flags: { supply_cap?: BigDecimal; borrow_cap?: BigDecimal },
  ): ResultAsync<TxHash, InvariantError> {
    const hubAddress = reserveInfo.asset.hub.address;
    const spokeAddress = reserveInfo.spoke.address;
    const assetId = BigInt(reserveInfo.asset.onchainAssetId);

    // Convert BigDecimal caps to BigInt (uint40)
    // Note: Caps appear to be stored in a format that doesn't require full decimal conversion
    // Converting with full decimals would exceed this limit, so we use the integer part
    const convertCapToUint40 = (cap: BigDecimal): bigint => {
      // Convert to integer (rounding down)
      const capBigInt = BigInt(cap.toFixed(0, RoundingMode.Down));
      const maxUint40 = BigInt('0xFFFFFFFFFF'); // 2^40 - 1 = 1,099,511,627,775
      if (capBigInt > maxUint40) {
        throw new InvariantError(
          `Cap value ${capBigInt} exceeds uint40 maximum of ${maxUint40}`,
        );
      }
      return capBigInt;
    };

    // Use current values from reserve or update with new caps
    const newAddCap = flags.supply_cap
      ? convertCapToUint40(flags.supply_cap)
      : convertCapToUint40(reserveInfo.supplyCap);
    const newDrawCap = flags.borrow_cap
      ? convertCapToUint40(flags.borrow_cap)
      : convertCapToUint40(reserveInfo.borrowCap);

    // Call contract function directly
    return ResultAsync.fromPromise(
      writeContract(wallet, {
        address: hubAddress,
        abi: this.updateSpokeConfigABI,
        functionName: 'updateSpokeConfig',
        args: [
          assetId,
          spokeAddress,
          {
            addCap: newAddCap,
            drawCap: newDrawCap,
            riskPremiumThreshold: 0n, // Default value, not available in reserve info
            active: reserveInfo.status.active,
            paused: reserveInfo.status.paused,
          },
        ],
      }),
      (error) => new InvariantError(String(error)),
    ).map((txHashString) => txHash(txHashString));
  }

  async run(): Promise<TxHash | InvariantError> {
    const user = await createNewWallet(
      '0x3d9ca529fb78a4ca983231de205242cdfa8b02aea48689c137cd91a4ed3426d0',
    );
    const parsed = await this.parse(UpdateCaps);

    const result = await this.getReserveRequest()
      .andThen((request) => reserve(this.client, request))
      .andThen((reserveInfo) => {
        if (!reserveInfo) {
          return err(new InvariantError('Reserve not found'));
        }

        return this.sendUpdateCapsTransaction(user, reserveInfo, {
          supply_cap: parsed.flags.supply_cap,
          borrow_cap: parsed.flags.borrow_cap,
        }).andThen((txHash) => {
          // Display the result
          this.display([[reserveInfo.id, txHash]]);
          return ok(txHash);
        });
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
