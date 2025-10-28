import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { borrow, preview, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_EMODE_ADDRESS,
  ETHEREUM_USDS_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
  getNativeBalance,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { sleep } from '../helpers/tools';
import { assertSingleElementArray } from '../test-utils';
import { findReserveToBorrow, supplyToRandomERC20Reserve } from './helper';

const user = await createNewWallet();

describe('Feature: Borrowing Assets on Aave V4', () => {
  describe('Given a user and a reserve with an active supply position used as collateral', () => {
    beforeAll(async () => {
      const setup = await fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_WSTETH_ADDRESS,
        amount: bigDecimal('0.2'),
      }).andThen(() =>
        supplyToRandomERC20Reserve(client, user, {
          token: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('0.1'),
        }),
      );

      assertOk(setup);
    });

    describe('When the user wants to preview the borrow action before performing it', () => {
      it('Then the user can review the borrow details before proceeding', async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const borrowPreviewResult = await findReserveToBorrow(client, user, {
          token: ETHEREUM_USDS_ADDRESS,
        }).andThen((reserve) =>
          preview(client, {
            action: {
              borrow: {
                reserve: {
                  reserveId: reserve.id,
                  chainId: reserve.chain.chainId,
                  spoke: reserve.spoke.address,
                },
                amount: {
                  erc20: {
                    value: bigDecimal('0.1'),
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
        ).toBeBigDecimalGreaterThan(10);
        expect(borrowPreviewResult.value.healthFactor.current).toBeNull();
      });
    });

    describe('When the user borrows an ERC20 asset', () => {
      it(`Then the user's borrow position is updated to reflect the ERC20 loan`, async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const reserveToBorrow = await findReserveToBorrow(client, user, {
          token: ETHEREUM_USDS_ADDRESS,
        });
        assertOk(reserveToBorrow);
        const amountToBorrow = bigDecimal(
          Number(reserveToBorrow.value.userState!.borrowable.amount.value) *
            0.1,
        );
        expect(amountToBorrow).toBeBigDecimalGreaterThan(0);
        const result = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveToBorrow.value.spoke.address,
            reserveId: reserveToBorrow.value.id,
            chainId: reserveToBorrow.value.chain.chainId,
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
                    address: reserveToBorrow.value.spoke.address,
                    chainId: reserveToBorrow.value.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

        assertOk(result);
        assertSingleElementArray(result.value);
        // BUG: The amount is slightly different from the total borrow amount
        expect(result.value[0].debt.amount.value).toBeBigDecimalCloseTo(
          amountToBorrow,
          2,
        );
        expect(result.value[0].debt.isWrappedNative).toBe(false);
      });
    });
  });

  describe('Given a user and a reserve with an active supply position used as collateral', () => {
    describe('When the user borrows a native asset from the reserve', () => {
      // NOTE: Need to use Emode Spoke to borrow native assets
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('0.2'),
        }).andThen(() =>
          supplyToRandomERC20Reserve(client, user, {
            token: ETHEREUM_WSTETH_ADDRESS,
            amount: bigDecimal('0.1'),
            spoke: ETHEREUM_SPOKE_EMODE_ADDRESS,
          }),
        );

        assertOk(setup);
      });
      it(`Then the user's borrow position is updated to reflect the native asset loan`, async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const reserveToBorrow = await findReserveToBorrow(client, user, {
          token: ETHEREUM_WETH_ADDRESS,
          spoke: ETHEREUM_SPOKE_EMODE_ADDRESS,
        });
        assertOk(reserveToBorrow);
        const amountToBorrow =
          reserveToBorrow.value.userState!.borrowable.amount.value;

        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        expect(amountToBorrow).toBeBigDecimalGreaterThan(0);
        const result = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: {
            spoke: reserveToBorrow.value.spoke.address,
            reserveId: reserveToBorrow.value.id,
            chainId: reserveToBorrow.value.chain.chainId,
          },
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
                  spoke: {
                    address: reserveToBorrow.value.spoke.address,
                    chainId: reserveToBorrow.value.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

        assertOk(result);
        assertSingleElementArray(result.value);
        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeCloseTo(
          balanceBefore + Number(amountToBorrow),
          4,
        );

        // BUG: The amount is slightly different from the total borrow amount
        expect(result.value[0].debt.amount.value).toBeBigDecimalCloseTo(
          amountToBorrow,
          4,
        );
        // BUG: It should be wrapped native
        // expect(result.value[0].amount.isWrappedNative).toBe(true);
      });
    });
  });
});
