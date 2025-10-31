import {
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
  type Reserve,
} from '@aave/client-next';
import { reserve, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKES,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { borrowFromReserve, supplyToReserve } from '../helpers/borrowSupply';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import { sleep } from '../helpers/tools';

const user = await createNewWallet();

describe('Borrowing from Multiple Reserves on Aave V4', () => {
  describe('Given a user with collateral supplied to a reserve', () => {
    let borrowReserves: Reserve[];

    describe('When the user borrows from two different reserves', () => {
      beforeAll(async () => {
        const listBorrowReserves = await findReservesToBorrow(client, user, {
          spoke: ETHEREUM_SPOKES.ISO_STABLE_SPOKE,
        });
        assertOk(listBorrowReserves);
        invariant(
          listBorrowReserves.value.length >= 2,
          'At least 2 borrow reserves are required',
        );
        borrowReserves = listBorrowReserves.value!;

        const listSupplyReserves = await findReservesToSupply(client, user, {
          spoke: ETHEREUM_SPOKES.ISO_STABLE_SPOKE,
          asCollateral: true,
        });
        assertOk(listSupplyReserves);
        invariant(
          listSupplyReserves.value.length >= 1,
          'At least 1 supply reserve is required',
        );

        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: listSupplyReserves.value[0]!.asset.underlying.address,
          amount: bigDecimal('5'),
        }).andThen(() =>
          supplyToReserve(client, user, {
            reserve: {
              reserveId: listSupplyReserves.value[0]!.id,
              chainId: listSupplyReserves.value[0]!.chain.chainId,
              spoke: listSupplyReserves.value[0]!.spoke.address,
            },
            amount: {
              erc20: { value: bigDecimal('4.9') },
            },
            sender: evmAddress(user.account.address),
            enableCollateral: true,
          }),
        );

        assertOk(setup);
      }, 120_000);

      it('Then the user has two active borrow positions with correct amounts', async () => {
        await sleep(1000); // TODO: Remove after fixed bug with delays of propagation
        const firstReserveInfo = await reserve(client, {
          query: {
            reserve: {
              reserveId: borrowReserves[0]!.id,
              chainId: borrowReserves[0]!.chain.chainId,
              spoke: borrowReserves[0]!.spoke.address,
            },
          },
          user: evmAddress(user.account.address),
        });
        assertOk(firstReserveInfo);
        const firstAmountToBorrow = bigDecimal(
          Number(firstReserveInfo!.value!.userState!.borrowable.amount.value) *
            0.1,
        );
        const firstBorrow = await borrowFromReserve(client, user, {
          reserve: {
            reserveId: firstReserveInfo!.value!.id,
            chainId: firstReserveInfo!.value!.chain.chainId,
            spoke: firstReserveInfo!.value!.spoke.address,
          },
          amount: {
            erc20: {
              value: firstAmountToBorrow,
            },
          },
          sender: evmAddress(user.account.address),
        });
        assertOk(firstBorrow);

        const secondReserveInfo = await reserve(client, {
          query: {
            reserve: {
              reserveId: borrowReserves[1]!.id,
              chainId: borrowReserves[1]!.chain.chainId,
              spoke: borrowReserves[1]!.spoke.address,
            },
          },
          user: evmAddress(user.account.address),
        });
        assertOk(secondReserveInfo);
        const secondAmountToBorrow = bigDecimal(
          Number(secondReserveInfo!.value!.userState!.borrowable.amount.value) *
            0.1,
        );
        const secondBorrow = await borrowFromReserve(client, user, {
          reserve: {
            reserveId: secondReserveInfo!.value!.id,
            chainId: secondReserveInfo!.value!.chain.chainId,
            spoke: secondReserveInfo!.value!.spoke.address,
          },
          amount: {
            erc20: { value: secondAmountToBorrow },
          },
          sender: evmAddress(user.account.address),
        });
        assertOk(secondBorrow);

        // Verify user has two borrow positions
        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: borrowReserves[0]!.spoke.address,
                chainId: borrowReserves[0]!.chain.chainId,
              },
              user: evmAddress(user.account.address),
            },
          },
        });

        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(2);

        const firstPosition = borrowPositions.value.find(
          (position) =>
            position.reserve.asset.underlying.address ===
              borrowReserves[0]!.asset.underlying.address &&
            position.reserve.asset.hub.address ===
              borrowReserves[0]!.asset.hub.address,
        );
        expect(firstPosition).toBeDefined();
        expect(firstPosition!.debt.amount.value).toBeBigDecimalCloseTo(
          firstAmountToBorrow,
          2,
        );

        const secondPosition = borrowPositions.value.find(
          (position) =>
            position.reserve.asset.underlying.address ===
              borrowReserves[1]!.asset.underlying.address &&
            position.reserve.asset.hub.address ===
              borrowReserves[1]!.asset.hub.address,
        );
        expect(secondPosition).toBeDefined();
        expect(secondPosition!.debt.amount.value).toBeBigDecimalCloseTo(
          secondAmountToBorrow,
          2,
        );
      });
    });
  });
});
