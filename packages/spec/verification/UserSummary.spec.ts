import type { UserBorrowItem, UserSummary, UserSupplyItem } from '@aave/client';
import { assertOk, bigDecimal, evmAddress, ResultAsync } from '@aave/client';
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
import { getAccountData, type UserAccountData } from '../helpers/on-chain';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../helpers/supplyBorrow';

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
            const result = await ResultAsync.combine([
              findReserveAndSupply(client, user, {
                spoke: ETHEREUM_SPOKE_ETHENA_ID,
                token: ETHEREUM_GHO_ADDRESS,
                asCollateral: true,
                amount: bigDecimal('0.1'),
              }),
              findReserveAndSupply(client, user, {
                spoke: ETHEREUM_SPOKE_ETHENA_ID,
                token: ETHEREUM_USDC_ADDRESS,
                asCollateral: false,
                amount: bigDecimal('100'),
              }),
            ]);
            assertOk(result);
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
              const result = await ResultAsync.combine([
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
              assertOk(result);

              [
                summaryData,
                accountDataCoreSpoke,
                accountDataIsoStableSpoke,
                userSuppliesItems,
                userBorrowsItems,
              ] = result.value;
            }, 180_000);

            it('Then the netBalance value should be the sum of the total supplied minus the borrows (debt)', async () => {
              const totalSupplied = userSuppliesItems.reduce(
                (acc, supply) => acc.plus(supply.withdrawable.exchange.value),
                bigDecimal('0'),
              );

              const totalDebt = userBorrowsItems.reduce(
                (acc, borrow) => acc.plus(borrow.debt.exchange.value),
                bigDecimal('0'),
              );

              expect(totalSupplied.minus(totalDebt)).toBeBigDecimalCloseTo(
                summaryData.netBalance.current.value,
                { percent: 0.1 },
              );
            });

            it('Then the totalCollateral value should be the sum of the collateral values from both spokes', async () => {
              const expectedTotalCollateral =
                accountDataCoreSpoke.totalCollateralValue.plus(
                  accountDataIsoStableSpoke.totalCollateralValue,
                );
              expect(summaryData.totalCollateral.value).toBeBigDecimalCloseTo(
                expectedTotalCollateral,
                { percent: 0.1 },
              );
            });

            it('Then the totalDebt value should be the sum of the debt values from both spokes', async () => {
              const expectedTotalDebt =
                accountDataCoreSpoke.totalDebtValue.plus(
                  accountDataIsoStableSpoke.totalDebtValue,
                );
              expect(summaryData.totalDebt.value).toBeBigDecimalCloseTo(
                expectedTotalDebt,
                { percent: 0.1 },
              );
            });

            it('Then the netApy value should be the weighted average of the supply and borrow APYs', async () => {
              // netApy = (Σ(supply_amount_i * supply_apy_i) - Σ(borrow_amount_j * borrow_apy_j)) / netWorth
              // where netWorth = totalSupplied - totalBorrowed
              const totalSupplied = userSuppliesItems.reduce(
                (acc, supply) => acc.plus(supply.withdrawable.exchange.value),
                bigDecimal('0'),
              );

              const totalBorrowed = userBorrowsItems.reduce(
                (acc, borrow) => acc.plus(borrow.debt.exchange.value),
                bigDecimal('0'),
              );

              const netWorth = totalSupplied.minus(totalBorrowed);

              const weightedSupplyApy = userSuppliesItems.reduce(
                (acc, supply) => {
                  const suppliedAmount = supply.withdrawable.exchange.value;
                  const supplyApy = supply.reserve.summary.supplyApy.normalized;
                  return acc.plus(suppliedAmount.times(supplyApy));
                },
                bigDecimal('0'),
              );

              const weightedBorrowApy = userBorrowsItems.reduce(
                (acc, borrow) => {
                  const borrowedAmount = borrow.debt.exchange.value;
                  const borrowApy = borrow.reserve.summary.borrowApy.normalized;
                  return acc.plus(borrowedAmount.times(borrowApy));
                },
                bigDecimal('0'),
              );

              const expectedNetApy = weightedSupplyApy
                .minus(weightedBorrowApy)
                .div(netWorth);

              expect(summaryData.netApy.normalized).toBeBigDecimalCloseTo(
                expectedNetApy,
                { percent: 0.1 },
              );
            });

            // TODO: Create ticket to check the math in the backend
            it('Then the netAccruedInterest value should be the sum of the supply interests minus the borrow interests', async () => {
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
                percent: 0.1,
              });
            });

            it('Then the lowestHealthFactor value should be the minimum of the health factors from both spokes', async () => {
              const expectedLowestHealthFactor =
                accountDataCoreSpoke.healthFactor.lt(
                  accountDataIsoStableSpoke.healthFactor,
                )
                  ? accountDataCoreSpoke.healthFactor
                  : accountDataIsoStableSpoke.healthFactor;

              expect(summaryData.lowestHealthFactor).toBeBigDecimalCloseTo(
                expectedLowestHealthFactor,
                { percent: 0.1 },
              );
            });
          });
        });
      });
    });
  });
});
