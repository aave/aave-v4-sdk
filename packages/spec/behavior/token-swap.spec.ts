import {
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
  TokenSwapKind,
} from '@aave/client';
import { prepareTokenSwap, swap, tokenSwapQuote } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@aave/client/testing';
import { sendTransaction, signTypedDataWith } from '@aave/client/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { beforeAll, describe, it } from 'vitest';

describe('Token swapping on Aave V4', () => {
  describe('Given a user who want to swap tokens', () => {
    describe.skip('When swapping and ERC-20 for which they have already approved', () => {
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

      it('Then they should be able to swap by just the swap order typed dat', async ({
        annotate,
      }) => {
        const swapResult = await tokenSwapQuote(client, {
          market: {
            amount: bigDecimal('20'),
            sell: { erc20: ETHEREUM_USDC_ADDRESS },
            buy: { erc20: ETHEREUM_WETH_ADDRESS },
            chainId: ETHEREUM_FORK_ID,
            kind: TokenSwapKind.Sell,
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
            return signTypedDataWith(userDidSwap, prepareResult.data).andThen(
              (finalSignature) =>
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
      });
    });
  });

  describe('When swapping ERC-20 for the first time', () => {
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

    it('Then they should be able to swap by sending the ERC20 approval transaction and by signing the swap order typed data', async ({
      annotate,
    }) => {
      const swapResult = await tokenSwapQuote(client, {
        market: {
          amount: bigDecimal('20'),
          sell: { erc20: ETHEREUM_USDC_ADDRESS },
          buy: { erc20: ETHEREUM_WETH_ADDRESS },
          chainId: ETHEREUM_FORK_ID,
          kind: TokenSwapKind.Sell,
          receiver: evmAddress(newUser.account.address),
          user: evmAddress(newUser.account.address),
        },
      })
        .map((swapPlan) => {
          invariant(
            swapPlan.__typename === 'SwapByIntentWithApprovalRequired',
            `Swap plan is not a swap by intent: ${swapPlan.__typename}`,
          );
          return swapPlan;
        })
        .andThen((swapPlan) =>
          sendTransaction(newUser, swapPlan.approvals[0]!.byTransaction)
            .andThen(() =>
              prepareTokenSwap(client, {
                quoteId: swapPlan.quote.quoteId,
              }),
            )
            .andThen((prepareResult) =>
              signTypedDataWith(newUser, prepareResult.data),
            )
            .andThen((signature) =>
              swap(client, {
                intent: {
                  quoteId: swapPlan.quote.quoteId,
                  signature: signature,
                },
              }),
            ),
        );

      assertOk(swapResult);
      invariant(
        swapResult.value.__typename === 'SwapReceipt',
        `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
      );
      annotate(`Swap id: ${swapResult.value.id}`);
    });

    it.todo('Then they should be able to swap via permit');
  });

  describe('When swapping native for ERC-20', () => {
    it.todo('Then they should be able to swap by signing 1 transaction');
  });
});
