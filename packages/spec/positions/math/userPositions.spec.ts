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
  ETHEREUM_SPOKE_CORE_ADDRESS,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  assertNonEmptyArray,
  assertSingleElementArray,
} from '../../test-utils';
import { recreateUserPositionInOneSpoke } from '../helper';
import { getAccountData, type UserAccountData } from './helper';

const user = await createNewWallet(
  '0xbae6035617e696766fc0a0739508200144f6e785600cc155496ddfc1d78a6a14',
);

describe('Check User Positions Math on Aave V4', () => {
  describe('Given a user with multiple deposits and at least two borrows in one spoke', () => {
    beforeAll(async () => {
      await recreateUserPositionInOneSpoke(client, user);
    }, 180_000);

    describe('When fetching the user positions for the user', () => {
      let positions: UserPosition;
      let suppliesPositions: UserSupplyItem[];
      let borrowPositions: UserBorrowItem[];
      let accountDataOnChain: UserAccountData;

      beforeAll(async () => {
        const [
          positionsResult,
          suppliesResult,
          borrowResult,
          accountDataResult,
        ] = await Promise.all([
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
          getAccountData(
            evmAddress(user.account.address),
            ETHEREUM_SPOKE_CORE_ADDRESS,
          ),
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

        accountDataOnChain = accountDataResult;
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
        // Cross check with the account data on chain
        expect(positions.totalCollateral.current.value).toBeBigDecimalCloseTo(
          accountDataOnChain.totalCollateralValue,
          1,
        );
      });

      it('Then it should return the correct netCollateral value', async () => {
        // net collateral is the sum of the total collateral minus the total debt
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
        const totalDebt = borrowPositions.reduce(
          (acc, borrow) =>
            acc.plus(
              borrow.debt.exchange.value.plus(borrow.interest.exchange.value),
            ),
          bigDecimal('0'),
        );

        // Cross check with the user positions
        expect(totalCollateral.minus(totalDebt)).toBeBigDecimalCloseTo(
          positions.netCollateral.current.value,
          1,
        );
      });

      it('Then it should return the correct totalDebt value', async () => {
        // total debt is the sum of the principal and interest for all positions in the spoke
        expect(positions.totalDebt.current.value).toBeBigDecimalCloseTo(
          accountDataOnChain.totalDebtValue,
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

      it('Then it should return the correct health factor', async () => {
        // Cross check with the user positions
        expect(positions.healthFactor.current).toBeBigDecimalCloseTo(
          accountDataOnChain.healthFactor,
          2,
        );
      });

      it('Then it should return the correct averageCollateralFactor value', async () => {
        const collateralPositions = suppliesPositions.filter(
          (supply) => supply.isCollateral,
        );

        const { weightedSum, totalValue } = collateralPositions.reduce(
          (acc, supply) => {
            const collateralValue = supply.principal.exchange.value.plus(
              supply.interest.exchange.value,
            );
            const collateralFactor =
              supply.reserve.settings.collateralFactor.value;
            return {
              weightedSum: acc.weightedSum.plus(
                collateralFactor.times(collateralValue),
              ),
              totalValue: acc.totalValue.plus(collateralValue),
            };
          },
          {
            weightedSum: bigDecimal('0'),
            totalValue: bigDecimal('0'),
          },
        );

        // Normalize: avgCollateralFactor = weightedSum / totalValue
        const averageCollateralFactor = weightedSum.div(totalValue);

        // Cross check with the account data on chain
        expect(averageCollateralFactor).toBeBigDecimalCloseTo(
          accountDataOnChain.avgCollateralFactor,
          5,
        );
        // Cross check with the user positions
        expect(averageCollateralFactor).toBeBigDecimalCloseTo(
          positions.averageCollateralFactor.value,
          5,
        );
      });

      it.todo('Then it should return the correct netApy value');
      it.todo('Then it should return the correct netSupplyApy value');
      it.todo('Then it should return the correct netBorrowApy value');
      it.todo('Then it should return the correct riskPremium value');
      it.todo('Then it should return the correct liquidationPrice value');
      it.todo('Then it should return the correct borrowingPower value');
    });
  });
});
