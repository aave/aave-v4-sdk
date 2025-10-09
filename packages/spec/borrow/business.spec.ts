import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { borrow, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertSingleElementArray } from '../test-utils';
import { findReserveToBorrow, supplyToRandomERC20Reserve } from './helper';

const user = await createNewWallet();

describe('Aave V4 Borrow Scenarios', () => {
  describe('Given a user with a supply position as collateral', () => {
    describe('When the user borrows an ERC20 asset', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WETH_ADDRESS,
          amount: bigDecimal('1.0'),
        }).andThen(() =>
          supplyToRandomERC20Reserve(client, user, {
            token: ETHEREUM_WETH_ADDRESS,
            amount: bigDecimal('0.5'),
          }),
        );

        assertOk(setup);
        console.log(`Supply to reserve: ${setup.value.spoke.address}`);
      });

      it(`Then the user's borrow positions are updated`, async () => {
        const reserveToBorrow = await findReserveToBorrow(
          client,
          user,
          ETHEREUM_GHO_ADDRESS,
        );
        assertOk(reserveToBorrow);
        const amountToBorrow =
          reserveToBorrow.value.userState!.borrowable.value.formatted;

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
        expect(result.value[0].amount.value.formatted).toBeBigDecimalCloseTo(
          amountToBorrow,
          2,
        );
        expect(result.value[0].amount.isWrappedNative).toBe(false);
      });
    });

    describe('When the user borrows from a reserve that supports native borrowing', () => {
      it.todo(`Then the user's borrow positions are updated`);
    });
  });
});
