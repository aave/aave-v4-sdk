import { assertOk, bigDecimal, evmAddress } from '@aave/client';
import { borrow, preview, userBorrows } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
  getNativeBalance,
} from '@aave/client/testing';
import { sendWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';

import { findReservesToBorrow } from '../helpers/reserves';
import { findReserveAndSupply } from '../helpers/supplyBorrow';
import { assertNonEmptyArray, assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Borrowing Assets on Aave V4', () => {
  describe('Given a user and a reserve with an active supply position used as collateral', () => {
    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        token: ETHEREUM_USDC_ADDRESS,
        spoke: ETHEREUM_SPOKE_CORE_ID,
        amount: bigDecimal('100'),
        asCollateral: true,
      });

      assertOk(setup);
    });

    describe('When the user wants to preview the borrow action before performing it', () => {
      it('Then the user can review the borrow details before proceeding', async () => {
        const borrowPreviewResult = await findReservesToBorrow(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
        }).andThen((reserves) =>
          preview(client, {
            action: {
              borrow: {
                reserve: reserves[0].id,
                amount: {
                  erc20: {
                    value:
                      reserves[0].userState!.borrowable.amount.value.times(0.2),
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
        const reservesToBorrow = await findReservesToBorrow(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
        });
        assertOk(reservesToBorrow);
        const amountToBorrow =
          reservesToBorrow.value[0].userState!.borrowable.amount.value.times(
            0.1,
          );
        expect(amountToBorrow).toBeBigDecimalGreaterThan(0);

        const result = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: reservesToBorrow.value[0].id,
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
                  spoke: reservesToBorrow.value[0].spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

        assertOk(result);
        assertSingleElementArray(result.value);
        expect(result.value[0].debt.amount.value).toBeBigDecimalCloseTo(
          amountToBorrow,
          2,
        );
        expect(result.value[0].debt.token.isWrappedNativeToken).toBe(false);
      });
    });
  });

  describe('Given a user and a reserve with an active supply position used as collateral', () => {
    describe('When the user borrows a native asset from the reserve', () => {
      beforeAll(async () => {
        const amountToSupply = bigDecimal('100');

        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: amountToSupply,
          decimals: 6,
        }).andThen(() =>
          findReserveAndSupply(client, user, {
            token: ETHEREUM_USDC_ADDRESS,
            amount: amountToSupply,
            spoke: ETHEREUM_SPOKE_CORE_ID,
            asCollateral: true,
          }),
        );

        assertOk(setup);
      });
      it(`Then the user's borrow position is updated to reflect the native asset loan`, async () => {
        const reservesToBorrow = await findReservesToBorrow(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_WETH_ADDRESS,
        });
        assertOk(reservesToBorrow);
        const amountToBorrow =
          reservesToBorrow.value[0].userState!.borrowable.amount.value.times(
            0.4,
          );
        expect(amountToBorrow).toBeBigDecimalGreaterThan(0);

        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        const result = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: reservesToBorrow.value[0].id,
          amount: {
            native: amountToBorrow,
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: reservesToBorrow.value[0].spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

        assertOk(result);
        assertNonEmptyArray(result.value);
        const position = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            reservesToBorrow.value[0].asset.underlying.address
          );
        });
        expect(position!).toMatchObject({
          id: expect.any(String),
          reserve: expect.any(Object),
          debt: expect.any(Object),
          interest: expect.any(Object),
          principal: expect.any(Object),
          createdAt: expect.any(String),
        });

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeBigDecimalCloseTo(
          balanceBefore.add(amountToBorrow),
          2,
        );

        expect(position?.debt.amount.value).toBeBigDecimalCloseTo(
          amountToBorrow,
          4,
        );
      });
    });
  });
});
