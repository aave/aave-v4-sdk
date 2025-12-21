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
    let suppliesPositions: UserSupplyItem[];

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
      suppliesPositions = resultSupplies.value;

      if (suppliesPositions.length < 3) {
        const supplyGHOCollateral = await findReserveAndSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_GHO_ADDRESS,
          asCollateral: true,
          amount: bigDecimal('100'),
        });
        assertOk(supplyGHOCollateral);

        const supplyUSDCDNoCollateral = await findReserveAndSupply(
          client,
          user,
          {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_USDC_ADDRESS,
            asCollateral: true,
            amount: bigDecimal('100'),
          },
        );
        assertOk(supplyUSDCDNoCollateral);

        const supplyWETHCollateral = await findReserveAndSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_AAVE_ADDRESS,
          asCollateral: false,
          amount: bigDecimal('0.5'),
        });
        assertOk(supplyWETHCollateral);
      }
    }, 100_000);

    describe('And 2 borrow positions', () => {
      let borrowPositions: UserBorrowItem[];

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
        borrowPositions = borrows.value;

        if (borrows.value.length < 2) {
          const borrowAAVE = await borrowFromRandomReserve(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_AAVE_ADDRESS,
            ratioToBorrow: 0.1,
          });
          assertOk(borrowAAVE);

          const borrowWETH = await borrowFromRandomReserve(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_WETH_ADDRESS,
            ratioToBorrow: 0.1,
          });
          assertOk(borrowWETH);
        }
      }, 180_000);

      describe('When fetching the user positions for the user', () => {
        let position: UserPosition;
        let accountDataOnChain: UserAccountData;

        beforeAll(async () => {
          const [positionsResult, accountDataResult] = await Promise.all([
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
          ]);

          assertOk(positionsResult);
          assertNonEmptyArray(positionsResult.value);
          // We only operate on one spoke, so we expect a single element array
          assertSingleElementArray(positionsResult.value);
          position = positionsResult.value[0];

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
            position.totalSupplied.current.value,
            1,
          );
        });

        it('Then it should return the correct totalCollateral value', async () => {
          // Cross check with the account data on chain
          expect(position.totalCollateral.current.value).toBeBigDecimalCloseTo(
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
            position.netCollateral.current.value,
            1,
          );
        });

        it('Then it should return the correct totalDebt value', async () => {
          // total debt is the sum of the principal and interest for all positions in the spoke
          expect(position.totalDebt.current.value).toBeBigDecimalCloseTo(
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
            position.netBalance.current.value,
            1,
          );
        });

        it('Then it should return the correct health factor', async () => {
          // Cross check with the user positions
          expect(position.healthFactor.current).toBeBigDecimalCloseTo(
            accountDataOnChain.healthFactor,
            2,
          );
        });

        it('Then it should return the correct averageCollateralFactor value', async () => {
          // Cross check with the user positions
          expect(position.averageCollateralFactor.value).toBeBigDecimalCloseTo(
            accountDataOnChain.avgCollateralFactor,
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
});
