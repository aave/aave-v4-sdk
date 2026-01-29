import type { UserBorrowItem, UserSummary, UserSupplyItem } from '@aave/client';
import { assertOk, bigDecimal, evmAddress } from '@aave/client';
import { userBorrows, userSummary, userSupplies } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_SPOKE_ETHENA_ADDRESS,
  ETHEREUM_SPOKE_ETHENA_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDT_ADDRESS,
} from '@aave/client/testing';

import { beforeAll, describe, expect, it } from 'vitest';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../../helpers/supplyBorrow';
import { getAccountData, type UserAccountData } from './helper';

const user = await createNewWallet(
  '0x6225076f88cd85d88be09773d417df6819f2f9c2b7885fe8c75b898c4b23c5fd',
);

describe('Given a user with two User Positions (2 different spokes)', () => {
  describe('With first user position with 3 supply positions, 2 of which set as collateral', () => {
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
    }, 180_000);

    describe('With first user position with 1 borrow position', () => {
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

        if (borrows.value.length < 1) {
          const borrowAAVE = await borrowFromRandomReserve(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_AAVE_ADDRESS,
            ratioToBorrow: 0.1,
          });
          assertOk(borrowAAVE);
        }
      }, 180_000);

      describe('With second user position with 2 supply positions, 1 of which set as collateral', () => {
        beforeAll(async () => {
          const supplies = await userSupplies(client, {
            query: {
              userSpoke: {
                spoke: ETHEREUM_SPOKE_ETHENA_ID,
                user: evmAddress(user.account.address),
              },
            },
          });
          assertOk(supplies);

          if (supplies.value.length < 2) {
            const supplyGHOCollateral = await findReserveAndSupply(
              client,
              user,
              {
                spoke: ETHEREUM_SPOKE_ETHENA_ID,
                token: ETHEREUM_GHO_ADDRESS,
                asCollateral: true,
                amount: bigDecimal('0.1'),
              },
            );
            assertOk(supplyGHOCollateral);

            const supplyUSDCDNoCollateral = await findReserveAndSupply(
              client,
              user,
              {
                spoke: ETHEREUM_SPOKE_ETHENA_ID,
                token: ETHEREUM_USDC_ADDRESS,
                asCollateral: false,
                amount: bigDecimal('100'),
              },
            );
            assertOk(supplyUSDCDNoCollateral);
          }
        }, 100_000);

        describe('With second user position with 1 borrow position', () => {
          beforeAll(async () => {
            const borrows = await userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: ETHEREUM_SPOKE_ETHENA_ID,
                  user: evmAddress(user.account.address),
                },
              },
            });
            assertOk(borrows);

            if (borrows.value.length < 1) {
              const borrowWETH = await borrowFromRandomReserve(client, user, {
                spoke: ETHEREUM_SPOKE_ETHENA_ID,
                token: ETHEREUM_USDT_ADDRESS,
                ratioToBorrow: 0.2,
              });
              assertOk(borrowWETH);
            }
          }, 100_000);

          describe('When fetching the User Summary data', () => {
            let summaryData: UserSummary;
            let accountDataCoreSpoke: UserAccountData;
            let accountDataIsoStableSpoke: UserAccountData;
            let userSuppliesItems: UserSupplyItem[];
            let userBorrowsItems: UserBorrowItem[];

            beforeAll(async () => {
              const [
                summaryResult,
                accountDataCoreSpokeResult,
                accountDataIsoStableSpokeResult,
                userSuppliesResult,
                userBorrowsResult,
              ] = await Promise.all([
                userSummary(client, {
                  user: evmAddress(user.account.address),
                  filter: {
                    chainIds: [ETHEREUM_FORK_ID],
                  },
                }),
                getAccountData(
                  evmAddress(user.account.address),
                  ETHEREUM_SPOKE_CORE_ADDRESS,
                ),
                getAccountData(
                  evmAddress(user.account.address),
                  ETHEREUM_SPOKE_ETHENA_ADDRESS,
                ),
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

              assertOk(summaryResult);
              assertOk(userSuppliesResult);
              assertOk(userBorrowsResult);

              summaryData = summaryResult.value;
              accountDataCoreSpoke = accountDataCoreSpokeResult;
              accountDataIsoStableSpoke = accountDataIsoStableSpokeResult;
              userSuppliesItems = userSuppliesResult.value;
              userBorrowsItems = userBorrowsResult.value;
            }, 180_000);

            it('Then it should return the correct netBalance value', async () => {
              // net balance is the sum of the total supplied minus the borrows (debt)
              const totalSupplied = userSuppliesItems.reduce(
                (acc, supply) =>
                  acc.plus(
                    supply.principal.exchange.value.plus(
                      supply.interest.exchange.value,
                    ),
                  ),
                bigDecimal('0'),
              );

              const totalDebt = userBorrowsItems.reduce(
                (acc, borrow) =>
                  acc.plus(
                    borrow.debt.exchange.value.plus(
                      borrow.interest.exchange.value,
                    ),
                  ),
                bigDecimal('0'),
              );

              expect(totalSupplied.minus(totalDebt)).toBeBigDecimalCloseTo(
                summaryData.netBalance.current.value,
                { percent: 0.05 },
              );
            });

            it('Then it should return the correct totalCollateral value', async () => {
              // total collateral is the sum of collateral values from both spokes
              const expectedTotalCollateral =
                accountDataCoreSpoke.totalCollateralValue.plus(
                  accountDataIsoStableSpoke.totalCollateralValue,
                );
              expect(summaryData.totalCollateral.value).toBeBigDecimalCloseTo(
                expectedTotalCollateral,
                { percent: 0.05 },
              );
            });

            it('Then it should return the correct totalDebt value', async () => {
              // total debt is the sum of debt values from both spokes
              const expectedTotalDebt =
                accountDataCoreSpoke.totalDebtValue.plus(
                  accountDataIsoStableSpoke.totalDebtValue,
                );
              expect(summaryData.totalDebt.value).toBeBigDecimalCloseTo(
                expectedTotalDebt,
                { percent: 0.05 },
              );
            });

            it('Then it should return the correct netApy value', async () => {
              // netApy = (Σ (supplied_amount_i * supply_apy_i) - Σ (borrowed_amount_j * borrow_apy_j)) / (Σ supplied_amount_i)
              const totalSupplied = userSuppliesItems.reduce(
                (acc, supply) =>
                  acc.plus(
                    supply.principal.exchange.value.plus(
                      supply.interest.exchange.value,
                    ),
                  ),
                bigDecimal('0'),
              );

              const weightedSupplyApy = userSuppliesItems.reduce(
                (acc, supply) => {
                  const suppliedAmount = supply.principal.exchange.value.plus(
                    supply.interest.exchange.value,
                  );
                  const supplyApy = supply.reserve.summary.supplyApy.value;
                  return acc.plus(suppliedAmount.times(supplyApy));
                },
                bigDecimal('0'),
              );

              const weightedBorrowApy = userBorrowsItems.reduce(
                (acc, borrow) => {
                  const borrowedAmount = borrow.debt.exchange.value.plus(
                    borrow.interest.exchange.value,
                  );
                  const borrowApy = borrow.reserve.summary.borrowApy.value;
                  return acc.plus(borrowedAmount.times(borrowApy));
                },
                bigDecimal('0'),
              );

              const expectedNetApy = weightedSupplyApy
                .minus(weightedBorrowApy)
                .div(totalSupplied);

              expect(summaryData.netApy.value).toBeBigDecimalCloseTo(
                expectedNetApy,
                { precision: 3 },
              );
            });

            it('Then it should return the correct netAccruedInterest value', async () => {
              // net accrued interest = sum of supply interests - sum of borrow interests
              const totalSupplyInterest = userSuppliesItems.reduce(
                (acc, supply) => acc.plus(supply.interest.exchange.value),
                bigDecimal('0'),
              );

              const totalBorrowInterest = userBorrowsItems.reduce(
                (acc, borrow) => acc.plus(borrow.interest.exchange.value),
                bigDecimal('0'),
              );

              const expectedNetAccruedInterest =
                totalSupplyInterest.minus(totalBorrowInterest);

              expect(
                summaryData.netAccruedInterest.value,
              ).toBeBigDecimalCloseTo(expectedNetAccruedInterest, {
                percent: 0.05,
              });
            });

            it('Then it should return the correct lowestHealthFactor value', async () => {
              // lowest health factor is the minimum across all positions
              const expectedLowestHealthFactor =
                accountDataCoreSpoke.healthFactor.lt(
                  accountDataIsoStableSpoke.healthFactor,
                )
                  ? accountDataCoreSpoke.healthFactor
                  : accountDataIsoStableSpoke.healthFactor;

              expect(summaryData.lowestHealthFactor).toBeBigDecimalCloseTo(
                expectedLowestHealthFactor,
                { precision: 3 },
              );
            });
          });
        });
      });
    });
  });
});
