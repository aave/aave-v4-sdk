import {
  bigDecimal,
  invariant,
  reserveId,
  type SupplySwapQuoteRequest,
  userSupplyItemId,
} from '@aave/client';
import { supplySwapQuote } from '@aave/client/actions';
import { Flags } from '@oclif/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import * as common from '../../../common.js';
import {
  executePositionMarketSwap,
  quoteRows,
} from '../../../helpers/swaps.js';

export default class ActionSwapSupply extends common.V4Command {
  static override description =
    'Swap supplied position into another reserve using market mode';

  static override flags = {
    'sell-position-id': Flags.string({
      required: true,
      description: 'Supply position ID to sell from',
    }),
    'buy-reserve-id': Flags.string({
      required: true,
      description: 'Reserve ID to buy into',
    }),
    amount: Flags.string({
      required: true,
      description: 'Amount to swap',
    }),
    'enable-collateral': Flags.boolean({
      required: false,
      default: false,
      description: 'Enable collateral on the resulting supply position',
    }),
    'quote-only': Flags.boolean({
      required: false,
      default: false,
      description: 'Only fetch and display quote',
    }),
    address: common.address({
      required: false,
      description: 'User address for quote generation',
    }),
    'private-key': common.privateKey({
      required: false,
    }),
  };

  protected override headers = [{ value: 'Field' }, { value: 'Value' }];

  async run(): Promise<unknown> {
    const { flags } = await this.parse(ActionSwapSupply);

    const amount = flags.amount.trim();
    invariant(amount.length > 0, 'Amount cannot be empty');

    const user = common.userAddressFromFlagOrEnv(flags.address);

    const request: SupplySwapQuoteRequest = {
      market: {
        sellPosition: userSupplyItemId(flags['sell-position-id']),
        buyReserve: reserveId(flags['buy-reserve-id']),
        amount: bigDecimal(amount),
        user,
        enableCollateral: flags['enable-collateral'],
      },
    };

    const quote = await supplySwapQuote(this.client, request);
    if (quote.isErr()) {
      this.error(quote.error);
    }

    this.display(quoteRows(quote.value.quote));

    if (flags['quote-only']) {
      return this.toSuccessJson(quote.value);
    }

    const privateKey = (flags['private-key'] ??
      process.env.PRIVATE_KEY) as `0x${string}`;
    invariant(
      privateKey,
      'Provide --private-key or PRIVATE_KEY environment variable',
    );

    const wallet = createWalletClient({
      account: privateKeyToAccount(privateKey),
      transport: http(),
    });

    const result = await executePositionMarketSwap(
      this.client,
      wallet,
      quote.value,
    );
    if (result.isErr()) {
      this.error(String(result.error));
    }

    const receipt = result.value;

    this.display([
      ['Swap ID', receipt.id],
      ['Created At', receipt.createdAt.toISOString()],
    ]);

    return this.toSuccessJson(receipt);
  }
}
