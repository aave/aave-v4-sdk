import {
  assertOk,
  type BigDecimal,
  bigDecimal,
  evmAddress,
} from '@aave/client';
import { preview, userSupplies, withdraw } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_CORE_ID,
  getBalance,
  getNativeBalance,
} from '@aave/client/testing';
import { sendWith } from '@aave/client/viem';
import type { Reserve } from '@aave/graphql';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  findReserveAndSupply,
  supplyNativeTokenToReserve,
} from '../helpers/supplyBorrow';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Withdrawing Assets on Aave V4', () => {
  describe('Given a user and a reserve with an active supply position', () => {
    let reserve: Reserve;
    let amountToSupply: BigDecimal;

    beforeEach(async () => {
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
      });
      assertOk(setup);
      reserve = setup.value.reserveInfo;
      amountToSupply = setup.value.amountSupplied;
    }, 40_000);

    describe('When the user withdraws part of their supplied tokens', () => {
      it("Then the user's supply position is updated to reflect the partial withdrawal", async () => {
        const amountToWithdraw = amountToSupply.div(2);
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          reserve.asset.underlying.address,
        );

        const withdrawResult = await withdraw(client, {
          reserve: reserve.id,
          amount: {
            erc20: { exact: amountToWithdraw },
          },
          sender: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: reserve.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);
        assertSingleElementArray(withdrawResult.value);
        expect(
          withdrawResult.value[0].withdrawable.amount.value,
        ).toBeBigDecimalCloseTo(amountToSupply.minus(amountToWithdraw), {
          precision: 2,
        });

        const balanceAfter = await getBalance(
          evmAddress(user.account.address),
          reserve.asset.underlying.address,
        );
        expect(balanceBefore.plus(amountToWithdraw)).toBeBigDecimalCloseTo(
          balanceAfter,
          { precision: 4 },
        );
      });
    });

    describe('When the user wants to preview the withdrawal action before performing it', () => {
      it('Then the user can review the withdrawal details before proceeding', async () => {
        const amountToWithdraw = amountToSupply.div(4);

        const previewResult = await preview(client, {
          action: {
            withdraw: {
              reserve: reserve.id,
              sender: evmAddress(user.account.address),
              amount: {
                erc20: {
                  exact: amountToWithdraw,
                },
              },
            },
          },
        });
        assertOk(previewResult);
        expect(
          previewResult.value.netBalance.after.value,
        ).toBeBigDecimalLessThan(previewResult.value.netBalance.current.value);
      });
    });

    describe('When the user withdraws all of their supplied tokens', () => {
      it("Then the user's supply position is closed and the full amount is withdrawn", async () => {
        const balanceBefore = await getBalance(
          evmAddress(user.account.address),
          reserve.asset.underlying.address,
        );

        const withdrawResult = await withdraw(client, {
          reserve: reserve.id,
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
                  spoke: reserve.spoke.id,
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
        expect(balanceAfter.gt(balanceBefore)).toBe(true);
      });
    });
  });

  // TODO: Enable when we have a test fork that allow us to control
  describe.skip('Given a user and a reserve that supports withdrawals in native tokens', () => {
    let reserveSupportingNative: Reserve;
    const amountToSupply = bigDecimal(0.05);

    beforeEach(async () => {
      const setup = await supplyNativeTokenToReserve(
        client,
        user,
        amountToSupply,
      );

      assertOk(setup);
      reserveSupportingNative = setup.value;
    }, 50_000);

    describe('When the user withdraws part of their supplied native tokens', () => {
      it('Then the user receives the partial amount in native tokens and their supply position is updated', async () => {
        const amountToWithdraw = amountToSupply.div(2);
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        const withdrawResult = await withdraw(client, {
          reserve: reserveSupportingNative.id,
          sender: evmAddress(user.account.address),
          amount: {
            native: { exact: amountToWithdraw },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: reserveSupportingNative.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(withdrawResult);

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeBigDecimalCloseTo(
          balanceBefore.plus(amountToWithdraw),
          { precision: 4 },
        );
      });
    });

    describe('When the user withdraws all of their supplied native tokens', () => {
      it('Then the user receives the full amount in native tokens and their supply position is closed', async () => {
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );
        const withdrawResult = await withdraw(client, {
          reserve: reserveSupportingNative.id,
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
                  spoke: reserveSupportingNative.spoke.id,
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
        expect(balanceAfter.gt(balanceBefore)).toBe(true);
      });
    });
  });
});
