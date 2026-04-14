import {
  bigDecimal,
  evmAddress,
  invariant,
  ok,
  TokenSwapKind,
  type TokenSwapQuoteRequest,
} from '@aave/client';
import { swappableTokens, tokenSwapQuote } from '@aave/client/actions';
import { toViemChain } from '@aave/client/viem';
import { Flags } from '@oclif/core';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import * as common from '../../../common.js';
import { executeTokenMarketSwap, quoteRows } from '../../../helpers/swaps.js';

export default class ActionSwapToken extends common.V4Command {
  static override description =
    'Swap one token for another token using market mode';

  static override flags = {
    chain: common.chain({
      required: true,
      description: 'Chain ID where the token swap will be executed',
    }),
    'sell-token': Flags.string({
      required: true,
      description: 'Token address to sell',
    }),
    'buy-token': Flags.string({
      required: true,
      description: 'Token address to buy',
    }),
    amount: Flags.string({
      required: true,
      description: 'Amount to swap',
    }),
    kind: Flags.string({
      required: false,
      options: ['sell', 'buy'],
      default: 'sell',
      description: 'Swap amount interpretation',
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
    const { flags } = await this.parse(ActionSwapToken);

    const amount = flags.amount.trim();
    invariant(amount.length > 0, 'Amount cannot be empty');

    const user = common.userAddressFromFlagOrEnv(flags.address);

    const request: TokenSwapQuoteRequest = {
      market: {
        chainId: flags.chain,
        sell: { erc20: evmAddress(flags['sell-token']) },
        buy: { erc20: evmAddress(flags['buy-token']) },
        amount: bigDecimal(amount),
        kind: flags.kind === 'buy' ? TokenSwapKind.Buy : TokenSwapKind.Sell,
        user,
        receiver: user,
      },
    };

    const quoteResult = await tokenSwapQuote(this.client, request);
    if (quoteResult.isErr()) {
      this.error(quoteResult.error);
    }

    switch (quoteResult.value.__typename) {
      case 'SwapByIntent':
      case 'SwapByIntentWithApprovalRequired':
      case 'SwapByTransaction':
      case 'SwapByTransactionWithApprovalRequired':
        this.display(quoteRows(quoteResult.value.quote));
        break;
      default:
        this.error(
          `Unsupported quote response: ${quoteResult.value.__typename}`,
        );
    }

    if (flags['quote-only']) {
      return this.toSuccessJson(quoteResult.value);
    }

    const privateKey = (flags['private-key'] ??
      process.env.PRIVATE_KEY) as `0x${string}`;
    invariant(
      privateKey,
      'Provide --private-key or PRIVATE_KEY environment variable',
    );

    const chainResult = await swappableTokens(this.client, {
      query: { chainIds: [flags.chain] },
    }).andThen((tokens) => {
      const token = tokens.find((item) => {
        return (
          item.__typename === 'Erc20Token' &&
          item.address.toLowerCase() === flags['sell-token'].toLowerCase()
        );
      });
      invariant(
        token,
        `Sell token is not swappable on chain ${flags.chain}: ${flags['sell-token']}`,
      );
      return ok(token.chain);
    });

    if (chainResult.isErr()) {
      this.error(String(chainResult.error));
    }

    const wallet = createWalletClient({
      account: privateKeyToAccount(privateKey),
      chain: toViemChain(chainResult.value),
      transport: http(chainResult.value.rpcUrl),
    });

    const execution = await executeTokenMarketSwap(
      this.client,
      wallet,
      quoteResult.value,
    );
    if (execution.isErr()) {
      this.error(String(execution.error));
    }

    const receipt = execution.value;

    this.display([
      ['Swap ID', receipt.id],
      ['Created At', receipt.createdAt],
    ]);

    return this.toSuccessJson(receipt);
  }
}
