import {
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
  okAsync,
  supportsPermit,
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
import { describe, it } from 'vitest';

const SWAP_AMOUNT = bigDecimal('20');

async function createUserWithBalance(
  privateKey?: `0x${string}`,
  amount = SWAP_AMOUNT,
): Promise<WalletClient<Transport, Chain, Account>> {
  const user = await createNewWallet(privateKey);

  const setup = await fundErc20Address(evmAddress(user.account.address), {
    address: ETHEREUM_USDC_ADDRESS,
    amount,
    decimals: 6,
  });
  assertOk(setup);
  return user;
}

describe('When swapping ERC-20 for the first time', () => {
  it('Then they should be able to swap by sending the ERC20 approval transaction and by signing the swap order typed data', async ({
    annotate,
  }) => {
    const newUser = await createUserWithBalance();

    const swapResult = await tokenSwapQuote(client, {
      market: {
        amount: SWAP_AMOUNT,
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
            signTypedDataWith(newUser, prepareResult.data).andThen(
              (signature) =>
                swap(client, {
                  intent: {
                    quoteId: prepareResult.newQuoteId,
                    signature,
                  },
                }),
            ),
          ),
      );

    assertOk(swapResult);
    invariant(
      swapResult.value.__typename === 'SwapReceipt',
      `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
    );
    annotate(`Swap id: ${swapResult.value.id}`);
  });

  it('Then they should be able to swap via permit', async ({ annotate }) => {
    const newUser = await createUserWithBalance();

    const swapResult = await tokenSwapQuote(client, {
      market: {
        amount: SWAP_AMOUNT,
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
          `Swap plan is not a swap by intent with approval required: ${swapPlan.__typename}`,
        );
        return swapPlan;
      })
      .andThen((swapPlan) =>
        (supportsPermit(swapPlan)
          ? signTypedDataWith(
              newUser,
              swapPlan.approvals[0].bySignature,
            ).andThen((permitSignature) =>
              prepareTokenSwap(client, {
                quoteId: swapPlan.quote.quoteId,
                permitSig: {
                  deadline: swapPlan.approvals[0].bySignature.message
                    .deadline as number,
                  value: permitSignature,
                },
              }),
            )
          : sendTransaction(
              newUser,
              swapPlan.approvals[0]!.byTransaction,
            ).andThen(() =>
              prepareTokenSwap(client, {
                quoteId: swapPlan.quote.quoteId,
              }),
            )
        ).andThen((prepareResult) =>
          signTypedDataWith(newUser, prepareResult.data).andThen((signature) =>
            swap(client, {
              intent: {
                quoteId: prepareResult.newQuoteId,
                signature,
              },
            }),
          ),
        ),
      );

    assertOk(swapResult);
    invariant(
      swapResult.value.__typename === 'SwapReceipt',
      `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
    );
    annotate(`Swap id: ${swapResult.value.id}`);
  });
});

describe('When swapping ERC-20 for ERC-20 using a limit order', () => {
  const LIMIT_BUY_AMOUNT = bigDecimal('0.001');

  it('Then they should be able to swap by sending the ERC20 approval transaction and by signing the swap order typed data', async ({
    annotate,
  }) => {
    const user = await createUserWithBalance();

    const swapResult = await tokenSwapQuote(client, {
      limit: {
        chainId: ETHEREUM_FORK_ID,
        sell: {
          erc20: {
            address: ETHEREUM_USDC_ADDRESS,
            value: SWAP_AMOUNT,
          },
        },
        buy: {
          erc20: {
            address: ETHEREUM_WETH_ADDRESS,
            value: LIMIT_BUY_AMOUNT,
          },
        },
        kind: TokenSwapKind.Sell,
        receiver: evmAddress(user.account.address),
        user: evmAddress(user.account.address),
        deadline: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
      .map((swapPlan) => {
        invariant(
          swapPlan.__typename === 'SwapByIntentWithApprovalRequired',
          `Swap plan is not a swap by intent with approval required: ${swapPlan.__typename}`,
        );
        invariant(
          swapPlan.approvals[0]?.byTransaction,
          'Swap plan is missing transaction approval',
        );
        return swapPlan;
      })
      .andThen((swapPlan) =>
        sendTransaction(user, swapPlan.approvals[0]!.byTransaction)
          .andThen(() =>
            prepareTokenSwap(client, {
              quoteId: swapPlan.quote.quoteId,
            }),
          )
          .andThen((prepareResult) =>
            signTypedDataWith(user, prepareResult.data).andThen((signature) =>
              swap(client, {
                intent: {
                  quoteId: prepareResult.newQuoteId,
                  signature,
                },
              }),
            ),
          ),
      );

    assertOk(swapResult);
    invariant(
      swapResult.value.__typename === 'SwapReceipt',
      `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
    );
    annotate(`Swap id: ${swapResult.value.id}`);
  });

  it('Then they should be able to swap via permit', async ({ annotate }) => {
    const user = await createUserWithBalance();

    const swapResult = await tokenSwapQuote(client, {
      limit: {
        chainId: ETHEREUM_FORK_ID,
        sell: {
          erc20: {
            address: ETHEREUM_USDC_ADDRESS,
            value: SWAP_AMOUNT,
          },
        },
        buy: {
          erc20: {
            address: ETHEREUM_WETH_ADDRESS,
            value: LIMIT_BUY_AMOUNT,
          },
        },
        kind: TokenSwapKind.Sell,
        receiver: evmAddress(user.account.address),
        user: evmAddress(user.account.address),
        deadline: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
      .map((swapPlan) => {
        invariant(
          swapPlan.__typename === 'SwapByIntentWithApprovalRequired',
          `Swap plan is not a swap by intent with approval required: ${swapPlan.__typename}`,
        );
        return swapPlan;
      })
      .andThen((swapPlan) =>
        (supportsPermit(swapPlan)
          ? signTypedDataWith(user, swapPlan.approvals[0].bySignature).andThen(
              (permitSignature) =>
                prepareTokenSwap(client, {
                  quoteId: swapPlan.quote.quoteId,
                  permitSig: {
                    deadline: swapPlan.approvals[0].bySignature.message
                      .deadline as number,
                    value: permitSignature,
                  },
                }),
            )
          : sendTransaction(user, swapPlan.approvals[0]!.byTransaction).andThen(
              () =>
                prepareTokenSwap(client, {
                  quoteId: swapPlan.quote.quoteId,
                }),
            )
        ).andThen((prepareResult) =>
          signTypedDataWith(user, prepareResult.data).andThen((signature) =>
            swap(client, {
              intent: {
                quoteId: prepareResult.newQuoteId,
                signature,
              },
            }),
          ),
        ),
      );

    assertOk(swapResult);
    invariant(
      swapResult.value.__typename === 'SwapReceipt',
      `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
    );
    annotate(`Swap id: ${swapResult.value.id}`);
  });
});

describe('When swapping native for ERC-20', () => {
  it('Then they should be able to swap by signing 1 transaction', async ({
    annotate,
  }) => {
    const user = await createNewWallet();

    const swapResult = await tokenSwapQuote(client, {
      market: {
        amount: bigDecimal('0.01'),
        sell: { native: true },
        buy: { erc20: ETHEREUM_USDC_ADDRESS },
        chainId: ETHEREUM_FORK_ID,
        kind: TokenSwapKind.Sell,
        receiver: evmAddress(user.account.address),
        user: evmAddress(user.account.address),
      },
    })
      .map((swapPlan) => {
        invariant(
          swapPlan.__typename === 'SwapByTransaction',
          `Swap plan is not a swap by transaction: ${swapPlan.__typename}`,
        );
        return swapPlan;
      })
      .andThen((swapPlan) =>
        swap(client, {
          transaction: {
            quoteId: swapPlan.quote.quoteId,
          },
        }).andThen((executionPlan) => {
          switch (executionPlan.__typename) {
            case 'SwapTransactionRequest':
              return sendTransaction(user, executionPlan.transaction).map(
                () => executionPlan.orderReceipt,
              );
            case 'SwapReceipt':
              return okAsync(executionPlan);
            default:
              invariant(false, `Unexpected plan: ${executionPlan}`);
          }
        }),
      );

    assertOk(swapResult);
    invariant(
      swapResult.value.__typename === 'SwapReceipt',
      `Swap result is not a swap receipt: ${swapResult.value.__typename}`,
    );
    annotate(`Swap id: ${swapResult.value.id}`);
  });
});
