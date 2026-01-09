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
  tokenSwapQuote,
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
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Token swapping on Aave V4', () => {
  describe('Given a user who has previously swapped the current token', () => {
    let userDidSwap: WalletClient<Transport, Chain, Account>;

    beforeAll(async () => {
      userDidSwap = await createNewWallet(
        '0x7e97068be691cce1b5c1216b8bc4600fa9c605fcef07c8ef5af05f86e838d69b',
      );

      const setup = await fundErc20Address(
        evmAddress(userDidSwap.account.address),
        {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('20'),
          decimals: 6,
        },
      );
      assertOk(setup);
    });

    describe('When the user swaps the token again', () => {
      it('Then the swap executes without requiring approval', async ({
        annotate,
      }) => {
        const swapResult = await tokenSwapQuote(client, {
          market: {
            amount: bigDecimal('20'),
            sell: { erc20: ETHEREUM_USDC_ADDRESS },
            buy: { erc20: ETHEREUM_WETH_ADDRESS },
            chainId: ETHEREUM_FORK_ID,
            kind: SwapKind.Sell,
            receiver: evmAddress(userDidSwap.account.address),
            user: evmAddress(userDidSwap.account.address),
          },
        }).andThen((swapPlan) => {
          invariant(
            swapPlan.__typename === 'SwapByIntent',
            `Swap plan is not a swap by intent: ${swapPlan.__typename}`,
          );
          return prepareTokenSwap(client, {
            quoteId: swapPlan.quote.quoteId,
          }).andThen((prepareResult) => {
            invariant(
              prepareResult.__typename === 'SwapByIntent',
              `Prepare token swap result is not a swap by intent: ${prepareResult.__typename}`,
            );
            return signSwapTypedDataWith(
              userDidSwap,
              prepareResult.data,
            ).andThen((finalSignature) =>
              swap(client, {
                intent: {
                  quoteId: swapPlan.quote.quoteId,
                  signature: finalSignature,
                },
              }),
            );
          });
        });

        assertOk(swapResult);
        invariant(
          swapResult.value.__typename === 'SwapReceipt',
          `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
        );
        annotate(`Swap id: ${swapResult.value.id}`);
        const status = await swapStatus(client, { id: swapResult.value.id });
        assertOk(status);
        // Check swap was opened successfully
        expect(status.value.__typename).toBe('SwapOpen');

        const swapPositions = await userSwaps(client, {
          chainId: ETHEREUM_FORK_ID,
          user: evmAddress(userDidSwap.account.address),
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

  describe('Given a user swapping a token for the first time', () => {
    let newUser: WalletClient<Transport, Chain, Account>;

    beforeAll(async () => {
      newUser = await createNewWallet();

      const setup = await fundErc20Address(
        evmAddress(newUser.account.address),
        {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('20'),
          decimals: 6,
        },
      );
      assertOk(setup);
    });

    describe('When the user initiates the swap', () => {
      it('Then the user must approve before swapping', async ({ annotate }) => {
        const swapResult = await tokenSwapQuote(client, {
          market: {
            amount: bigDecimal('20'),
            sell: { erc20: ETHEREUM_USDC_ADDRESS },
            buy: { erc20: ETHEREUM_WETH_ADDRESS },
            chainId: ETHEREUM_FORK_ID,
            kind: SwapKind.Sell,
            receiver: evmAddress(newUser.account.address),
            user: evmAddress(newUser.account.address),
          },
        }).andThen((swapPlan) => {
          invariant(
            swapPlan.__typename === 'SwapByIntentWithApprovalRequired',
            `Swap plan is not a swap by intent: ${swapPlan.__typename}`,
          );
          return sendTransaction(
            newUser,
            swapPlan.approval.byTransaction,
          ).andThen(() =>
            prepareTokenSwap(client, {
              quoteId: swapPlan.quote.quoteId,
            }).andThen((prepareResult) => {
              invariant(
                prepareResult.__typename === 'SwapByIntent',
                `Prepare token swap result is not a swap by intent: ${prepareResult.__typename}`,
              );
              return signSwapTypedDataWith(newUser, prepareResult.data).andThen(
                (signature) => {
                  return swap(client, {
                    intent: {
                      quoteId: swapPlan.quote.quoteId,
                      signature: signature,
                    },
                  });
                },
              );
            }),
          );
        });

        assertOk(swapResult);
        invariant(
          swapResult.value.__typename === 'SwapReceipt',
          `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
        );
        annotate(`Swap id: ${swapResult.value.id}`);
        const status = await swapStatus(client, { id: swapResult.value.id });
        assertOk(status);
        // Check swap was opened successfully
        expect(status.value.__typename).toBe('SwapOpen');

        const swapPositions = await userSwaps(client, {
          chainId: ETHEREUM_FORK_ID,
          user: evmAddress(newUser.account.address),
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

  describe('Given a user with a native token', () => {
    describe('When the user swaps it for a wrapped native token', () => {
      it.todo('Then the swap executes via a single transaction');
    });
  });
});
