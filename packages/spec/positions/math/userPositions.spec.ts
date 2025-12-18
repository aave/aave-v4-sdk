import {
  assertOk,
  bigDecimal,
  evmAddress,
  type UserBorrowItem,
  type UserPosition,
  type UserSupplyItem,
} from '@aave/client';
import { userBorrows, userPositions, userSupplies } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  assertNonEmptyArray,
  assertSingleElementArray,
} from '../../test-utils';
import { recreateUserPositionInOneSpoke } from '../helper';

const user = await createNewWallet(
  '0xbae6035617e696766fc0a0739508200144f6e785600cc155496ddfc1d78a6a14',
);

describe('Check User Positions Math on Aave V4', () => {
  describe('Given a user with multiple deposits and at least one borrow in one spoke', () => {
    beforeAll(async () => {
      // NOTE: Recreate user with at least one position with multiple deposits and at least two borrow in one spoke
      await recreateUserPositionInOneSpoke(client, user);
    }, 180_000);

    describe('When fetching the user positions for the user', () => {
      let positions: UserPosition;
      let suppliesPositions: UserSupplyItem[];
      let borrowPositions: UserBorrowItem[];

      beforeAll(async () => {
        const [positionsResult, suppliesResult, borrowResult] =
          await Promise.all([
            userPositions(client, {
              user: evmAddress(user.account.address),
              filter: {
                chainIds: [ETHEREUM_FORK_ID],
              },
            }),
            userSupplies(client, {
              query: {
                userChains: {
                  chainIds: [ETHEREUM_FORK_ID],
                  user: evmAddress(user.account.address),
                },
              },
            }),
            userBorrows(client, {
              query: {
                userChains: {
                  chainIds: [ETHEREUM_FORK_ID],
                  user: evmAddress(user.account.address),
                },
              },
            }),
          ]);

        assertOk(positionsResult);
        assertNonEmptyArray(positionsResult.value);
        // We only operate on one spoke, so we expect a single element array
        assertSingleElementArray(positionsResult.value);
        positions = positionsResult.value[0];

        assertOk(suppliesResult);
        assertNonEmptyArray(suppliesResult.value);
        suppliesPositions = suppliesResult.value;

        assertOk(borrowResult);
        assertNonEmptyArray(borrowResult.value);
        borrowPositions = borrowResult.value;
      }, 180_000);

      it('Then it should return the correct totalSupplied value', async () => {
        // total supplied is the sum of the principal and interest for all positions in the spoke
        const totalSupplied = suppliesPositions.reduce(
          (acc, supply) =>
            acc.plus(
              supply.principal.exchange.value.plus(
                supply.interest.exchange.value,
              ),
            ),
          bigDecimal('0'),
        );
        expect(totalSupplied).toBeBigDecimalCloseTo(
          positions.totalSupplied.current.value,
          1,
        );
      });

      it('Then it should return the correct totalCollateral value', async () => {
        // total collateral is the sum of the principal and interest for all positions marked as collateral in the spoke
        const totalCollateral = suppliesPositions
          .filter((supply) => supply.isCollateral)
          .reduce(
            (acc, supply) =>
              acc.plus(
                supply.principal.exchange.value.plus(
                  supply.interest.exchange.value,
                ),
              ),
            bigDecimal('0'),
          );

        expect(totalCollateral).toBeBigDecimalCloseTo(
          positions.totalCollateral.current.value,
          1,
        );
      });

      it('Then it should return the correct totalDebt value', async () => {
        // total debt is the sum of the principal and interest for all positions in the spoke
        const totalDebt = borrowPositions.reduce(
          (acc, borrow) =>
            acc.plus(
              borrow.debt.exchange.value.plus(borrow.interest.exchange.value),
            ),
          bigDecimal('0'),
        );
        expect(totalDebt).toBeBigDecimalCloseTo(
          positions.totalDebt.current.value,
          1,
        );
      });

      it('Then it should return the correct netBalance value', async () => {
        // net balance is the sum of the total supplied minus the borrows (debt)
        const totalSupplied = suppliesPositions.reduce(
          (acc, supply) =>
            acc.plus(
              supply.principal.exchange.value.plus(
                supply.interest.exchange.value,
              ),
            ),
          bigDecimal('0'),
        );

        const totalDebt = borrowPositions.reduce(
          (acc, borrow) =>
            acc.plus(
              borrow.debt.exchange.value.plus(borrow.interest.exchange.value),
            ),
          bigDecimal('0'),
        );

        expect(totalSupplied.minus(totalDebt)).toBeBigDecimalCloseTo(
          positions.netBalance.current.value,
          1,
        );
      });
    });
  });
});
