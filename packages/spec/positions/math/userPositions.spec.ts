import {
  assertOk,
  bigDecimal,
  evmAddress,
  ResultAsync,
  type UserBorrowItem,
  type UserPosition,
  type UserSupplyItem,
} from '@aave/client';
import { userBorrows, userPositions, userSupplies } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../../helpers/supplyBorrow';
import {
  assertNonEmptyArray,
  assertSingleElementArray,
} from '../../test-utils';
import { getAccountData, type UserAccountData } from './helper';

const user = await createNewWallet(
  '0xbae6035617e696766fc0a0739508200144f6e785600cc155496ddfc1d78a6a14',
);

describe('Given a user with a User Position on a Spoke', () => {
  describe('With 3 supply positions, 2 of which set as collateral', () => {
    beforeAll(async () => {
      const resultSupplies = await userSupplies(client, {
        query: {
          userSpoke: {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            user: evmAddress(user.account.address),
          },
        },
      });
      assertOk(resultSupplies);

      if (resultSupplies.value.length < 3) {
        const result = await ResultAsync.combine([
          findReserveAndSupply(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_GHO_ADDRESS,
            asCollateral: true,
            amount: bigDecimal('100'),
          }),
          findReserveAndSupply(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_USDC_ADDRESS,
            asCollateral: true,
            amount: bigDecimal('100'),
          }),
          findReserveAndSupply(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_AAVE_ADDRESS,
            asCollateral: false,
            amount: bigDecimal('0.5'),
          }),
        ]);
        assertOk(result);
      }
    }, 100_000);

    describe('And 2 borrow positions', () => {
      beforeAll(async () => {
        const borrows = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrows);

        if (borrows.value.length < 2) {
          const result = await ResultAsync.combine([
            borrowFromRandomReserve(client, user, {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              token: ETHEREUM_AAVE_ADDRESS,
              ratioToBorrow: 0.1,
            }),
            borrowFromRandomReserve(client, user, {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              token: ETHEREUM_WETH_ADDRESS,
              ratioToBorrow: 0.1,
            }),
          ]);
          assertOk(result);
        }
      }, 180_000);

      describe('When fetching the User Position data', () => {
        let position: UserPosition;
        let accountDataOnChain: UserAccountData;
        let suppliesPositions: UserSupplyItem[];
        let borrowPositions: UserBorrowItem[];

        beforeAll(async () => {
          let positions: UserPosition[];
          const result = await ResultAsync.combine([
            userPositions(client, {
              user: evmAddress(user.account.address),
              filter: {
                chainIds: [ETHEREUM_FORK_ID],
              },
            }),
            getAccountData(
              evmAddress(user.account.address),
              ETHEREUM_SPOKE_CORE_ADDRESS,
            ),
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: ETHEREUM_SPOKE_CORE_ID,
                  user: evmAddress(user.account.address),
                },
              },
            }),
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: ETHEREUM_SPOKE_CORE_ID,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          ]);

          assertOk(result);
          [positions, accountDataOnChain, suppliesPositions, borrowPositions] =
            result.value;

          assertNonEmptyArray(positions);
          assertSingleElementArray(positions);
          position = positions[0];
        }, 180_000);

        it('Then the totalSupplied value should be the sum of the principal and interest for all positions in the spoke', async () => {
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
            position.totalSupplied.current.value,
            { precision: 2 },
          );
        });

        it('Then the totalCollateral value should be the sum of the collateral values from the spoke', async () => {
          expect(position.totalCollateral.current.value).toBeBigDecimalCloseTo(
            accountDataOnChain.totalCollateralValue,
            {
              precision: 1,
            },
          );
        });

        it('Then the netCollateral value should be the sum of the total collateral minus the total debt', async () => {
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

          expect(totalCollateral.minus(totalDebt)).toBeBigDecimalCloseTo(
            position.netCollateral.current.value,
            { percent: 0.05 },
          );
        });

        it('Then the totalDebt value should be the sum of the principal and interest for all positions in the spoke', async () => {
          expect(position.totalDebt.current.value).toBeBigDecimalCloseTo(
            accountDataOnChain.totalDebtValue,
            { precision: 1 },
          );
        });

        it('Then the netBalance value should be the sum of the total supplied minus the borrows (debt)', async () => {
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
            position.netBalance.current.value,
            { percent: 0.05 },
          );
        });

        it('Then the healthFactor value should be the health factor from the spoke', async () => {
          expect(position.healthFactor.current).toBeBigDecimalCloseTo(
            accountDataOnChain.healthFactor,
            { precision: 2 },
          );
        });

        it('Then the averageCollateralFactor value should be the average collateral factor from the spoke', async () => {
          expect(position.averageCollateralFactor.value).toBeBigDecimalCloseTo(
            accountDataOnChain.avgCollateralFactor,
            { precision: 2 },
          );
        });

        it('Then the riskPremium value should be the risk premium from the spoke', async () => {
          expect(position.riskPremium?.current.value).toBeBigDecimalCloseTo(
            accountDataOnChain.riskPremium,
            { precision: 2 },
          );
        });

        it.todo('Then it should return the correct netApy value');
        it.todo('Then it should return the correct netSupplyApy value');
        it.todo('Then it should return the correct netBorrowApy value');
        it.todo('Then it should return the correct borrowingPower value');
        it.todo('Then it should return the correct liquidationPrice value');
      });
    });
  });
});
