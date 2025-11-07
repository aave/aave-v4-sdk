import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { borrow, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { encodeSpokeId } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToBorrow } from '../helpers/reserves';
import { supplyToRandomERC20Reserve } from '../helpers/supplyBorrow';
import { sleep } from '../helpers/tools';

const user = await createNewWallet();

describe('Borrowing from Multiple Reserves on Aave V4', () => {
  describe('Given a user with collateral supplied to a reserve', () => {
    describe('When the user borrows from two different reserves', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('0.2'),
        }).andThen(() =>
          supplyToRandomERC20Reserve(client, user, {
            token: ETHEREUM_WSTETH_ADDRESS,
            spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
            amount: bigDecimal('0.1'),
            asCollateral: true,
          }),
        );

        assertOk(setup);
      }, 120_000);

      it('Then the user has two active borrow positions with correct amounts', async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const reservesToBorrow = await findReservesToBorrow(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
        });
        assertOk(reservesToBorrow);
        expect(reservesToBorrow.value.length).toBeGreaterThanOrEqual(2);

        const firstBorrow = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: reservesToBorrow.value[0].id,
          amount: {
            erc20: {
              value:
                reservesToBorrow.value[0].userState!.borrowable.amount.value.times(
                  0.1,
                ),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction);
        assertOk(firstBorrow);

        const secondBorrow = await borrow(client, {
          sender: evmAddress(user.account.address),
          reserve: reservesToBorrow.value[1]!.id,
          amount: {
            erc20: {
              value:
                reservesToBorrow.value[1]!.userState!.borrowable.amount.value.times(
                  0.1,
                ),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction);
        assertOk(secondBorrow);

        // Verify user has two borrow positions
        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),
              user: evmAddress(user.account.address),
            },
          },
        });

        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(2);

        // Verify first borrow position (USDC)
        const usdcPosition = borrowPositions.value.find(
          (position) =>
            position.reserve.asset.underlying.address ===
            reservesToBorrow.value[0]!.asset.underlying.address,
        );
        expect(usdcPosition).toBeDefined();
        expect(usdcPosition!.debt.amount.value).toBeBigDecimalCloseTo(
          reservesToBorrow.value[0]!.userState!.borrowable.amount.value.times(
            0.1,
          ),
          2,
        );

        // Verify second borrow position (USDS)
        const usdsPosition = borrowPositions.value.find(
          (position) =>
            position.reserve.asset.underlying.address ===
            reservesToBorrow.value[1]!.asset.underlying.address,
        );
        expect(usdsPosition).toBeDefined();
        expect(usdsPosition!.debt.amount.value).toBeBigDecimalCloseTo(
          reservesToBorrow.value[1]!.userState!.borrowable.amount.value.times(
            0.1,
          ),
          2,
        );
      });
    });
  });
});
