import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { borrow, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDS_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { sleep } from '../helpers/tools';
import { findReserveToBorrow, supplyToRandomERC20Reserve } from './helper';

const user = await createNewWallet();

describe('Borrowing from Multiple Reserves on Aave V4', () => {
  describe('Given a user with collateral supplied to a reserve', () => {
    describe('When the user borrows from two different reserves', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('2'),
        }).andThen(() =>
          supplyToRandomERC20Reserve(client, user, {
            token: ETHEREUM_WSTETH_ADDRESS,
            amount: bigDecimal('1.0'),
          }),
        );

        assertOk(setup);
      }, 120_000);

      it('Then the user has two active borrow positions with correct amounts', async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const firstBorrow = await findReserveToBorrow(client, user, {
          token: ETHEREUM_USDC_ADDRESS,
        }).andThen((reserve) =>
          borrow(client, {
            sender: evmAddress(user.account.address),
            reserve: {
              spoke: reserve.spoke.address,
              reserveId: reserve.id,
              chainId: reserve.chain.chainId,
            },
            amount: {
              erc20: {
                value: bigDecimal(
                  Number(reserve.userState!.borrowable.amount.value) * 0.1,
                ),
              },
            },
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction)
            .map(() => reserve),
        );
        assertOk(firstBorrow);

        const secondBorrow = await findReserveToBorrow(client, user, {
          token: ETHEREUM_USDS_ADDRESS,
        }).andThen((reserve) =>
          borrow(client, {
            sender: evmAddress(user.account.address),
            reserve: {
              spoke: reserve.spoke.address,
              reserveId: reserve.id,
              chainId: reserve.chain.chainId,
            },
            amount: {
              erc20: {
                value: bigDecimal(
                  Number(reserve.userState!.borrowable.amount.value) * 0.1,
                ),
              },
            },
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction)
            .map(() => reserve),
        );

        assertOk(secondBorrow);

        // Verify user has two borrow positions
        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              },
              user: evmAddress(user.account.address),
            },
          },
        });

        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(2);

        // Verify first borrow position (USDC)
        const usdcPosition = borrowPositions.value.find(
          (position) =>
            position.reserve.asset.underlying.address === ETHEREUM_USDC_ADDRESS,
        );
        expect(usdcPosition).toBeDefined();
        expect(usdcPosition!.debt.amount.value).toBeBigDecimalCloseTo(
          Number(firstBorrow.value.userState!.borrowable.amount.value) * 0.1,
          2,
        );

        // Verify second borrow position (USDS)
        const usdsPosition = borrowPositions.value.find(
          (position) =>
            position.reserve.asset.underlying.address === ETHEREUM_USDS_ADDRESS,
        );
        expect(usdsPosition).toBeDefined();
        expect(usdsPosition!.debt.amount.value).toBeBigDecimalCloseTo(
          Number(secondBorrow.value.userState!.borrowable.amount.value) * 0.1,
          2,
        );
      });
    });
  });
});
