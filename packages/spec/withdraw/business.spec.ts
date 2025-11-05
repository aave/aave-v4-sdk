import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { preview, userSupplies, withdraw } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  fundErc20Address,
  getBalance,
  getNativeBalance,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeEach, describe, expect, it } from 'vitest';
import { supplyNativeTokenToReserve, supplyToReserve } from '../borrow/helper';
import { findReservesToSupply } from '../helpers/reserves';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Withdrawing Assets on Aave V4', () => {
  describe('Given a user and a reserve with an active supply position', () => {
    let reserve: Reserve;
    const amountToSupply = 0.1;

    beforeEach(async () => {
      const setup = await findReservesToSupply(client, user).andThen(
        (listReserves) =>
          fundErc20Address(evmAddress(user.account!.address), {
            address: listReserves[0].asset.underlying.address,
            amount: bigDecimal('1'),
            decimals: listReserves[0].asset.underlying.info.decimals,
          }).andThen(() =>
            supplyToReserve(client, user, {
              reserve: {
                reserveId: listReserves[0].id,
                chainId: listReserves[0].chain.chainId,
                spoke: listReserves[0].spoke.address,
              },
              amount: {
                erc20: {
                  value: bigDecimal(amountToSupply.toString()),
                },
              },
              sender: evmAddress(user.account.address),
            }).map(() => listReserves[0]),
          ),
      );
      assertOk(setup);
      reserve = setup.value;
    }, 40_000);

    describe('When the user withdraws part of their supplied tokens', () => {
      it("Then the user's supply position is updated to reflect the partial withdrawal", async () => {
        const amountToWithdraw = amountToSupply / 2;
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          reserve.asset.underlying.address,
        );

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
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
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
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
          reserve.asset.underlying.address,
        );
        expect(balanceBefore + amountToWithdraw).toBeCloseTo(balanceAfter, 4);
      });
    });

    describe('When the user wants to preview the withdrawal action before performing it', () => {
      it('Then the user can review the withdrawal details before proceeding', async () => {
        const amountToWithdraw = amountToSupply / 3;

        const previewResult = await preview(client, {
          action: {
            withdraw: {
              reserve: {
                reserveId: reserve.id,
                chainId: reserve.chain.chainId,
                spoke: reserve.spoke.address,
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
          reserve.asset.underlying.address,
        );

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
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
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
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
          reserve.asset.underlying.address,
        );
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
      });
    });
  });

  describe('Given a user and a reserve that supports withdrawals in native tokens', () => {
    let reserveSupportingNative: Reserve;
    const amountToSupply = 0.05;

    beforeEach(async () => {
      const setup = await supplyNativeTokenToReserve(
        client,
        user,
        bigDecimal(amountToSupply),
      );

      assertOk(setup);
      reserveSupportingNative = setup.value;
    }, 50_000);

    describe('When the user withdraws part of their supplied native tokens', () => {
      it('Then the user receives the partial amount in native tokens and their supply position is updated', async () => {
        const amountToWithdraw = amountToSupply / 2;
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );
        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserveSupportingNative.spoke.address,
            reserveId: reserveSupportingNative.id,
            chainId: reserveSupportingNative.chain.chainId,
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
                    address: reserveSupportingNative.spoke.address,
                    chainId: reserveSupportingNative.chain.chainId,
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
            spoke: reserveSupportingNative.spoke.address,
            reserveId: reserveSupportingNative.id,
            chainId: reserveSupportingNative.chain.chainId,
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
                    address: reserveSupportingNative.spoke.address,
                    chainId: reserveSupportingNative.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        if (withdrawResult.value.length > 0) {
          // check position is closed, in case other tests failed
          assertSingleElementArray(withdrawResult.value);
          expect(
            withdrawResult.value[0].reserve.asset.underlying.address,
          ).not.toBe(reserveSupportingNative.asset.underlying.address);
        }

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
      });
    });
  });
});
