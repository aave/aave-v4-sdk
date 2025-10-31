import {
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
  type Reserve,
} from '@aave/client-next';
import {
  borrow,
  preview,
  reserve,
  userBorrows,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  fundErc20Address,
  getNativeBalance,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';

import { supplyToReserve } from '../helpers/borrowSupply';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { sleep } from '../helpers/tools';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Feature: Borrowing Assets on Aave V4', () => {
  describe('Given a user and a reserve with an active supply position used as collateral', () => {
    let reserves: { supplyReserve: Reserve; borrowReserve: Reserve };

    beforeAll(async () => {
      // Borrow reserve must be the same spoke as the supply reserve
      const supplyReserve = await findReservesToSupply(client, user, {
        asCollateral: true,
      });
      assertOk(supplyReserve);

      const borrowReserve = await findReservesToBorrow(client, user, {
        spoke: supplyReserve.value[0]!.spoke.address,
      });
      assertOk(borrowReserve);
      reserves = {
        supplyReserve: supplyReserve.value[0]!,
        borrowReserve: borrowReserve.value[0]!,
      };

      const setup = await fundErc20Address(evmAddress(user.account.address), {
        address: reserves.supplyReserve.asset.underlying.address,
        amount: bigDecimal('2'),
      }).andThen(() =>
        supplyToReserve(client, user, {
          reserve: {
            reserveId: reserves.supplyReserve.id,
            chainId: reserves.supplyReserve.chain.chainId,
            spoke: reserves.supplyReserve.spoke.address,
          },
          amount: {
            erc20: { value: bigDecimal('1') },
          },
          sender: evmAddress(user.account.address),
        }),
      );

      assertOk(setup);
    });

    describe('When the user wants to preview the borrow action before performing it', () => {
      it('Then the user can review the borrow details before proceeding', async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const borrowPreviewResult = await reserve(client, {
          query: {
            reserve: {
              reserveId: reserves.borrowReserve.id,
              chainId: reserves.borrowReserve.chain.chainId,
              spoke: reserves.borrowReserve.spoke.address,
            },
          },
          user: evmAddress(user.account.address),
        }).andThen((reserveInfo) =>
          preview(client, {
            action: {
              borrow: {
                reserve: {
                  reserveId: reserveInfo!.id,
                  chainId: reserveInfo!.chain.chainId,
                  spoke: reserveInfo!.spoke.address,
                },
                amount: {
                  erc20: {
                    value: bigDecimal(
                      Number(reserveInfo!.userState!.borrowable.amount.value) *
                        0.2,
                    ),
                  },
                },
                sender: evmAddress(user.account.address),
              },
            },
          }),
        );
        assertOk(borrowPreviewResult);
        expect(
          borrowPreviewResult.value.healthFactor.after,
        ).toBeBigDecimalGreaterThan(1);
        expect(borrowPreviewResult.value.healthFactor.current).toBeNull();
      });
    });

    describe('When the user borrows an ERC20 asset', () => {
      it(`Then the user's borrow position is updated to reflect the ERC20 loan`, async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const reserveInfo = await reserve(client, {
          query: {
            reserve: {
              reserveId: reserves.borrowReserve.id,
              chainId: reserves.borrowReserve.chain.chainId,
              spoke: reserves.borrowReserve.spoke.address,
            },
          },
          user: evmAddress(user.account.address),
        });
        assertOk(reserveInfo);
        const amountToBorrow = bigDecimal(
          Number(reserveInfo!.value!.userState!.borrowable.amount.value) * 0.2,
        );
        expect(amountToBorrow).toBeBigDecimalGreaterThan(0);

        const borrowResult = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveInfo!.value!.spoke.address,
            reserveId: reserveInfo!.value!.id,
            chainId: reserveInfo!.value!.chain.chainId,
          },
          amount: {
            erc20: {
              value: amountToBorrow,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserveInfo!.value!.spoke.address,
                    chainId: reserveInfo!.value!.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

        assertOk(borrowResult);
        assertSingleElementArray(borrowResult.value);
        // BUG: The amount is slightly different from the total borrow amount
        expect(borrowResult.value[0].debt.amount.value).toBeBigDecimalCloseTo(
          amountToBorrow,
          2,
        );
        expect(borrowResult.value[0].debt.isWrappedNative).toBe(false);
      });
    });
  });

  describe('Given a user and a reserve with an active supply position used as collateral', () => {
    describe('When the user borrows a native asset from the reserve', () => {
      let reserves: { supplyReserve: Reserve; borrowReserve: Reserve };

      beforeAll(async () => {
        // Borrow reserve must be the same spoke as the supply reserve
        const borrowReserve = await findReservesToBorrow(client, user);
        assertOk(borrowReserve);
        const nativeReserveToBorrow = await borrowReserve.value.find(
          (reserve) => reserve.asset.underlying.isWrappedNativeToken === true,
        );
        invariant(
          nativeReserveToBorrow,
          'No native reserve found to borrow from any spoke',
        );
        const supplyReserve = await findReservesToSupply(client, user, {
          asCollateral: true,
          spoke: nativeReserveToBorrow.spoke.address,
        });
        assertOk(supplyReserve);
        reserves = {
          supplyReserve: supplyReserve.value[0]!,
          borrowReserve: nativeReserveToBorrow,
        };

        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: reserves.supplyReserve.asset.underlying.address,
          amount: bigDecimal('0.1'),
        }).andThen(() =>
          supplyToReserve(client, user, {
            reserve: {
              reserveId: reserves.supplyReserve.id,
              chainId: reserves.supplyReserve.chain.chainId,
              spoke: reserves.supplyReserve.spoke.address,
            },
            amount: {
              erc20: { value: bigDecimal('0.05') },
            },
            sender: evmAddress(user.account.address),
          }),
        );

        assertOk(setup);
      });

      it(`Then the user's borrow position is updated to reflect the native asset loan`, async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const reserveInfo = await reserve(client, {
          query: {
            reserve: {
              reserveId: reserves.borrowReserve.id,
              chainId: reserves.borrowReserve.chain.chainId,
              spoke: reserves.borrowReserve.spoke.address,
            },
          },
          user: evmAddress(user.account.address),
        });
        assertOk(reserveInfo);
        const amountToBorrow = bigDecimal(
          Number(reserveInfo!.value!.userState!.borrowable.amount.value) * 0.1,
        );
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(amountToBorrow).toBeBigDecimalGreaterThan(0);

        const borrowResult = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveInfo!.value!.spoke.address,
            reserveId: reserveInfo!.value!.id,
            chainId: reserveInfo!.value!.chain.chainId,
          },
          amount: {
            native: amountToBorrow,
          },
        })
          .andTee((result) => console.log('result', result))
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserveInfo!.value!.spoke.address,
                    chainId: reserveInfo!.value!.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

        assertOk(borrowResult);
        assertSingleElementArray(borrowResult.value);
        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeCloseTo(
          balanceBefore + Number(amountToBorrow),
          4,
        );

        // BUG: The amount is slightly different from the total borrow amount
        expect(borrowResult.value[0].debt.amount.value).toBeBigDecimalCloseTo(
          amountToBorrow,
          4,
        );
        // BUG: It should be wrapped native
        // expect(result.value[0].amount.isWrappedNative).toBe(true);
      });
    });
  });
});
