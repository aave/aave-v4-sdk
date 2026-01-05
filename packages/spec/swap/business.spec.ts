import {
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
  SwapKind,
} from '@aave/client';
import {
  prepareTokenSwap,
  swap,
  swapStatus,
  userSwaps,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@aave/client/testing';
import { sendTransaction, signSwapTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';

const user = await createNewWallet(
  '0x7e97068be691cce1b5c1216b8bc4600fa9c605fcef07c8ef5af05f86e838d69b',
);

describe('Aave V4 Swap Scenarios', () => {
  describe('Given a user wants to swap an ERC20 asset', () => {
    describe('When the user swaps an ERC20 asset', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('20'),
          decimals: 6,
        });
        assertOk(setup);
      });

      it(`Then the user's swap positions are updated`, async ({ annotate }) => {
        const swapResult = await prepareTokenSwap(client, {
          market: {
            amount: bigDecimal('20'),
            sell: { erc20: ETHEREUM_USDC_ADDRESS },
            buy: { erc20: ETHEREUM_WETH_ADDRESS },
            chainId: ETHEREUM_FORK_ID,
            kind: SwapKind.Sell,
            receiver: evmAddress(user.account.address),
            user: evmAddress(user.account.address),
          },
        }).andThen((swapPlan) => {
          switch (swapPlan.__typename) {
            case 'SwapByIntent':
              return signSwapTypedDataWith(user, swapPlan.data).andThen(
                (signature) => {
                  return swap(client, {
                    intent: {
                      quoteId: swapPlan.quote.quoteId,
                      signature: signature,
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
                        signature: signature,
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
            default:
              throw new Error(
                `Unexpected swap plan type: ${(swapPlan as unknown as { __typename: string }).__typename}`,
              );
          }
        });

        assertOk(swapResult);
        invariant(
          swapResult.value.__typename === 'SwapReceipt',
          'Swap result is not a swap receipt',
        );
        annotate(`Swap id: ${swapResult.value.id}`);
        const status = await swapStatus(client, { id: swapResult.value.id });
        assertOk(status);
        // Check swap was opened successfully
        expect(status.value.__typename).toBe('SwapOpen');

        const swapPositions = await userSwaps(client, {
          chainId: ETHEREUM_FORK_ID,
          user: evmAddress(user.account.address),
        });
        assertOk(swapPositions);
        expect(
          swapPositions.value.items.find(
            (swap) =>
              swap.__typename === 'SwapOpen' &&
              swapResult.value.__typename === 'SwapReceipt' &&
              swap.swapId === swapResult.value.id,
          ),
        ).toBeDefined();
      });
    });
  });
});
