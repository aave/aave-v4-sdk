import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { preview, userSupplies, withdraw } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_TOKENS,
  fundErc20Address,
  getBalance,
  getNativeBalance,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { supplyToReserve } from '../helpers/borrowSupply';
import { findReservesToSupply } from '../helpers/reserves';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Withdrawing Assets on Aave V4', () => {
  let listReserves: Reserve[];

  beforeAll(async () => {
    const result = await findReservesToSupply(client, user);
    assertOk(result);
    listReserves = result.value;
  });
  describe('Given a user and a reserve with an active supply position', () => {
    const amountToSupply = 100;
    let reserveErc20: Reserve;

    beforeAll(async () => {
      reserveErc20 = listReserves.find(
        (ele) => ele.asset.underlying.address === ETHEREUM_TOKENS.USDC,
      )!;
      const setup = await fundErc20Address(evmAddress(user.account!.address), {
        address: ETHEREUM_TOKENS.USDC,
        amount: bigDecimal('100'),
        decimals: 6,
      }).andThen(() =>
        supplyToReserve(client, user, {
          reserve: {
            reserveId: reserveErc20.id,
            chainId: reserveErc20.chain.chainId,
            spoke: reserveErc20.spoke.address,
          },
          amount: {
            erc20: {
              value: bigDecimal('100'),
            },
          },
          sender: evmAddress(user.account.address),
        }),
      );

      assertOk(setup);
    });

    describe('When the user withdraws part of their supplied tokens', () => {
      it("Then the user's supply position is updated to reflect the partial withdrawal", async () => {
        const amountToWithdraw = amountToSupply / 2;
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_TOKENS.USDC,
        );

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserveErc20.spoke.address,
            reserveId: reserveErc20.id,
            chainId: reserveErc20.chain.chainId,
          },
          amount: {
            erc20: { exact: bigDecimal(amountToWithdraw) },
          },
          sender: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserveErc20.spoke.address,
                    chainId: reserveErc20.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        assertSingleElementArray(withdrawResult.value);
        expect(
          withdrawResult.value[0].withdrawable.amount.value,
        ).toBeBigDecimalCloseTo(amountToSupply - amountToWithdraw, 2);

        const balanceAfter = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_TOKENS.USDC,
        );
        expect(balanceBefore + amountToWithdraw).toEqual(balanceAfter);
      });
    });

    describe('When the user wants to preview the withdrawal action before performing it', () => {
      it('Then the user can review the withdrawal details before proceeding', async () => {
        const amountToWithdraw = amountToSupply / 3;

        const previewResult = await preview(client, {
          action: {
            withdraw: {
              reserve: {
                reserveId: reserveErc20.id,
                chainId: reserveErc20.chain.chainId,
                spoke: reserveErc20.spoke.address,
              },
              sender: evmAddress(user.account.address),
              amount: {
                erc20: {
                  exact: bigDecimal(amountToWithdraw),
                },
              },
            },
          },
        });
        assertOk(previewResult);
        expect(
          previewResult.value.netCollateral.after.value,
        ).toBeBigDecimalLessThan(
          previewResult.value.netCollateral.current.value,
        );
      });
    });

    describe('When the user withdraws all of their supplied tokens', () => {
      it("Then the user's supply position is closed and the full amount is withdrawn", async () => {
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_TOKENS.USDC,
        );

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserveErc20.spoke.address,
            reserveId: reserveErc20.id,
            chainId: reserveErc20.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              max: true,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserveErc20.spoke.address,
                    chainId: reserveErc20.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        expect(withdrawResult.value.length).toBe(0);

        const balanceAfter = await getBalance(
          evmAddress(user.account.address),
          ETHEREUM_TOKENS.USDC,
        );
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
      });
    });
  });

  describe('Given a user and a reserve that supports withdrawals in native tokens', () => {
    let reserveNative: Reserve;
    const amountToSupply = 0.1;

    beforeAll(async () => {
      reserveNative = listReserves.find(
        (ele) => ele.asset.underlying.isWrappedNativeToken === true,
      )!;
      const setup = await supplyToReserve(client, user, {
        reserve: {
          reserveId: reserveNative.id,
          chainId: reserveNative.chain.chainId,
          spoke: reserveNative.spoke.address,
        },
        amount: {
          native: bigDecimal(amountToSupply),
        },
        sender: evmAddress(user.account.address),
      });
      assertOk(setup);
    });

    describe('When the user withdraws part of their supplied native tokens', () => {
      it('Then the user receives the partial amount in native tokens and their supply position is updated', async () => {
        const amountToWithdraw = amountToSupply / 2;
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );
        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserveNative.spoke.address,
            reserveId: reserveNative.id,
            chainId: reserveNative.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            native: { exact: bigDecimal(amountToWithdraw) },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserveNative.spoke.address,
                    chainId: reserveNative.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeCloseTo(balanceBefore + amountToWithdraw, 4);
      });
    });

    describe('When the user withdraws all of their supplied native tokens', () => {
      it('Then the user receives the full amount in native tokens and their supply position is closed', async () => {
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );
        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserveNative.spoke.address,
            reserveId: reserveNative.id,
            chainId: reserveNative.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            native: { max: true },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserveNative.spoke.address,
                    chainId: reserveNative.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        if (withdrawResult.value.length > 0) {
          // check exactly position WETH is closed, in case other tests failed
          assertSingleElementArray(withdrawResult.value);
          expect(
            withdrawResult.value[0].reserve.asset.underlying.address,
          ).not.toBe(ETHEREUM_TOKENS.WETH);
        }

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
      });
    });
  });
});
