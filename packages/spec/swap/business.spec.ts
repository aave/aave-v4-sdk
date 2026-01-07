import { assertOk, bigDecimal, evmAddress, SwapKind } from '@aave/client';
import { prepareSwap, swap, swapQuote } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@aave/client/test-utils';
import { sendTransaction, signSwapTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, it } from 'vitest';

const user = await createNewWallet(
  '0x7e97068be691cce1b5c1216b8bc4600fa9c605fcef07c8ef5af05f86e838d69b',
);

describe('Aave V4 Swap Scenarios', () => {
  describe('Given a user wants to swap an ERC20 asset', () => {
    describe('When the user swaps an ERC20 asset', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('200'),
          decimals: 6,
        });
        assertOk(setup);
      });

      it(`Then the user's swap positions are updated`, async () => {
        // 1. Request a quote
        const swapResult = await swapQuote(client, {
          amount: bigDecimal('100'),
          sell: { erc20: ETHEREUM_USDC_ADDRESS },
          buy: { erc20: ETHEREUM_WETH_ADDRESS },
          chainId: ETHEREUM_FORK_ID,
          from: evmAddress(user.account.address),
          kind: SwapKind.Sell,
          receiver: evmAddress(user.account.address),
        })
          .andThen((quote) =>
            prepareSwap(client, {
              limit: {
                quoteId: quote.quoteId,
              },
            }),
          )
          .andThen((swapPlan) => {
            switch (swapPlan.__typename) {
              case 'SwapByIntent':
                return signSwapTypedDataWith(user, swapPlan.data).andThen(
                  (signature) => {
                    return swap(client, {
                      intent: {
                        quoteId: swapPlan.quote.quoteId,
                        signature: signature.value,
                      },
                    });
                  },
                );
              case 'SwapByIntentWithApprovalRequired':
                return sendTransaction(user, swapPlan.approval).andThen(() =>
                  signSwapTypedDataWith(user, swapPlan.data).andThen(
                    (signature) => {
                      return swap(client, {
                        intent: {
                          quoteId: swapPlan.quote.quoteId,
                          signature: signature.value,
                        },
                      });
                    },
                  ),
                );
              case 'SwapByTransaction':
                return swap(client, {
                  transaction: { quoteId: swapPlan.quote.quoteId },
                });
              case 'InsufficientBalanceError':
                throw new Error(
                  `Insufficient balance: ${swapPlan.required.value} required.`,
                );
            }
          });

        assertOk(swapResult);
      });
    });
  });
});
