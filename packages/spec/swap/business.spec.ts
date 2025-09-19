import { assertOk, bigDecimal, evmAddress, SwapKind } from '@aave/client-next';
import { prepareSwap, swapQuote } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_DAI_ADDRESS,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, it } from 'vitest';

describe('Aave V4 Swap Scenarios', () => {
  describe('Given a user wants to swap an ERC20 asset', () => {
    describe('When the user swaps an ERC20 asset', () => {
      const user = createNewWallet();

      beforeAll(async () => {
        const setup = await fundErc20Address(
          evmAddress(user.account!.address),
          {
            address: ETHEREUM_USDC_ADDRESS,
            amount: bigDecimal('200'),
            decimals: 6,
          },
        );

        assertOk(setup);
      });

      it(`Then the user's swap positions are updated`, async () => {
        // 1. Request a quote
        // TODO: bug in Cow protocol blocking us by cloudfront
        const quote = await swapQuote(client, {
          amount: bigDecimal('100'),
          sell: { erc20: ETHEREUM_USDC_ADDRESS },
          buy: { erc20: ETHEREUM_DAI_ADDRESS },
          chainId: ETHEREUM_FORK_ID,
          from: evmAddress(user.account!.address),
        });
        assertOk(quote);

        // 2. Swap Execution
        const prepareSwapResult = await prepareSwap(client, {
          market: {
            amount: bigDecimal('100'),
            sell: { erc20: ETHEREUM_USDC_ADDRESS },
            buy: { erc20: ETHEREUM_DAI_ADDRESS },
            chainId: ETHEREUM_FORK_ID,
            user: evmAddress(user.account!.address),
            kind: SwapKind.Buy,
          },
        });
        assertOk(prepareSwapResult);
      });
    });
  });
});
