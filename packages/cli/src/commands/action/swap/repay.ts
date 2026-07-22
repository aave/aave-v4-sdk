import {
  bigDecimal,
  invariant,
  type RepayWithSupplyQuoteRequest,
  reserveId,
  userBorrowItemId,
} from '@aave/client';
import { repayWithSupplyQuote } from '@aave/client/actions';
import { Flags } from '@oclif/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import * as common from '../../../common.js';
import {
  executePositionMarketSwap,
  quoteRows,
} from '../../../helpers/swaps.js';

export default class ActionSwapRepay extends common.V4Command {
  static override description =
    'Repay debt using another supply position through market swap';

  static override flags = {
    'debt-position-id': Flags.string({
      required: true,
      description: 'Debt position ID to repay',
    }),
    'repay-with-reserve-id': Flags.string({
      required: true,
      description: 'Reserve ID used as repayment source',
    }),
    amount: Flags.string({
      required: true,
      description: 'Amount to repay',
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
    const { flags } = await this.parse(ActionSwapRepay);

    const amount = flags.amount.trim();
    invariant(amount.length > 0, 'Amount cannot be empty');

    const user = common.userAddressFromFlagOrEnv(flags.address);

    const request: RepayWithSupplyQuoteRequest = {
      market: {
        debtPosition: userBorrowItemId(flags['debt-position-id']),
        repayWithReserve: reserveId(flags['repay-with-reserve-id']),
        amount: bigDecimal(amount),
        user,
      },
    };

    const quote = await repayWithSupplyQuote(this.client, request);
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
