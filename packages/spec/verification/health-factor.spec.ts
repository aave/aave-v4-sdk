import {
  assertOk,
  type BigDecimal,
  bigDecimal,
  evmAddress,
  type Reserve,
} from '@aave/client';
import {
  borrow,
  repay,
  userSummary,
  userSupplies,
  withdraw,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client/testing';
import { sendWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import {
  findReserveAndSupply,
  supplyAndBorrow,
  supplyToReserve,
} from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Health Factor Scenarios on Aave V4', () => {
  describe('Given a user with a one supply position as collateral', () => {
    describe('When the user checks the health factor', () => {
      beforeAll(async () => {
        const amountToSupply = bigDecimal('100');

        const setup = await findReserveAndSupply(client, user, {
          token: ETHEREUM_USDC_ADDRESS,
          spoke: ETHEREUM_SPOKE_CORE_ID,
          asCollateral: true,
          amount: amountToSupply,
        });

        assertOk(setup);
      });

      it('Then the health factor should be null', async () => {
        const summary = await userSummary(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(summary);
        expect(summary.value.lowestHealthFactor).toBeNull();
      });
    });

    describe('And the user has a one borrow position', () => {
      let usedReserves: { borrowReserve: Reserve; supplyReserve: Reserve };

      beforeAll(async () => {
        const reservesToBorrow = await findReservesToBorrow(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
        });
        assertOk(reservesToBorrow);

        const setup = await findReservesToSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          canUseAsCollateral: true,
        }).andThen((reservesToSupply) => {
          const amountToSupply = reservesToSupply[0].supplyCap
            .minus(reservesToSupply[0].summary.supplied.amount.value)
            .div(10000);

          return fundErc20Address(evmAddress(user.account.address), {
            address: reservesToSupply[0].asset.underlying.address,
            amount: amountToSupply,
            decimals: reservesToSupply[0].asset.underlying.info.decimals,
          })
            .andThen(() =>
              supplyAndBorrow(client, user, {
                reserveToSupply: reservesToSupply[0],
                amountToSupply: amountToSupply,
                reserveToBorrow: reservesToBorrow.value[0],
                ratioToBorrow: 0.1,
              }),
            )
            .map(() => ({
              borrowReserve: reservesToBorrow.value[0],
              supplyReserve: reservesToSupply[0],
            }));
        });
        assertOk(setup);
        usedReserves = setup!.value;
      }, 60_000);

      describe('When the user checks the health factor', () => {
        it('Then the health factor should be a number greater than 1', async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          expect(summary.value.lowestHealthFactor).toBeBigDecimalGreaterThan(1);
        });
      });

      describe('When the user supplies more collateral', () => {
        let HFBeforeSupply: BigDecimal;

        beforeAll(async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          HFBeforeSupply = summary.value.lowestHealthFactor!;

          const amountToSupply = usedReserves.supplyReserve.supplyCap
            .minus(usedReserves.supplyReserve.summary.supplied.amount.value)
            .div(10000);

          const setup = await fundErc20Address(
            evmAddress(user.account.address),
            {
              address: usedReserves.supplyReserve.asset.underlying.address,
              amount: amountToSupply,
              decimals:
                usedReserves.supplyReserve.asset.underlying.info.decimals,
            },
          ).andThen(() =>
            supplyToReserve(client, user, {
              amount: { erc20: { value: amountToSupply } },
              reserve: usedReserves.supplyReserve.id,
              enableCollateral: true,
              sender: evmAddress(user.account.address),
            }),
          );

          assertOk(setup);
        });

        it('Then the health factor should be greater than before supplying more collateral', async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          expect(summary.value.lowestHealthFactor).toBeBigDecimalGreaterThan(
            HFBeforeSupply,
          );
        });
      });

      describe('When the user repays partially the borrow position', () => {
        let HFBeforeRepay: BigDecimal;

        beforeAll(async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          HFBeforeRepay = summary.value.lowestHealthFactor!;

          const setup = await fundErc20Address(
            evmAddress(user.account.address),
            {
              address: usedReserves.borrowReserve.asset.underlying.address,
              amount:
                usedReserves.borrowReserve.userState!.borrowable.amount.value.times(
                  1.5,
                ),
              decimals:
                usedReserves.borrowReserve.asset.underlying.info.decimals,
            },
          )
            .andThen(() =>
              repay(client, {
                reserve: usedReserves.borrowReserve.id,
                sender: evmAddress(user.account.address),
                amount: {
                  erc20: {
                    value: {
                      exact:
                        usedReserves.borrowReserve.userState!.borrowable.amount.value.div(
                          20,
                        ),
                    },
                  },
                },
              }),
            )
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction);

          assertOk(setup);
        });

        it('Then the health factor should be greater than before repaying partially', async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          expect(summary.value.lowestHealthFactor).toBeBigDecimalGreaterThan(
            HFBeforeRepay,
          );
        });
      });

      describe('When the user borrows more money', () => {
        let HFBeforeBorrow: BigDecimal;

        beforeAll(async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          HFBeforeBorrow = summary.value.lowestHealthFactor!;

          const setup = await borrow(client, {
            sender: evmAddress(user.account.address),
            reserve: usedReserves.borrowReserve.id,
            amount: {
              erc20: {
                value:
                  usedReserves.borrowReserve.userState!.borrowable.amount.value.times(
                    0.1,
                  ),
              },
            },
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction);

          assertOk(setup);
        });

        it('Then the health factor should be less than before borrowing more money', async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          expect(HFBeforeBorrow).toBeBigDecimalGreaterThan(
            summary.value.lowestHealthFactor,
          );
        });
      });

      describe('When the user withdraws collateral', () => {
        let HFBeforeWithdraw: BigDecimal;

        beforeAll(async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          HFBeforeWithdraw = summary.value.lowestHealthFactor!;

          const supplies = await userSupplies(client, {
            query: {
              userSpoke: {
                spoke: usedReserves.supplyReserve.spoke.id,
                user: evmAddress(user.account.address),
              },
            },
          });
          assertOk(supplies);
          const amountToWithdraw = supplies.value
            .find(
              (supply) => supply.reserve.id === usedReserves.supplyReserve.id,
            )!
            .withdrawable.amount.value.div(2);

          const setup = await withdraw(client, {
            reserve: usedReserves.supplyReserve.id,
            sender: evmAddress(user.account.address),
            amount: {
              erc20: {
                exact: amountToWithdraw,
              },
            },
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction);

          assertOk(setup);
        }, 60_000);

        it('Then the health factor should be less than before withdrawing collateral', async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          expect(HFBeforeWithdraw).toBeBigDecimalGreaterThan(
            summary.value.lowestHealthFactor,
          );
        });
      });

      describe('When the user repays completely the borrow position', () => {
        beforeAll(async () => {
          const setup = await fundErc20Address(
            evmAddress(user.account.address),
            {
              address: usedReserves.borrowReserve.asset.underlying.address,
              amount:
                usedReserves.borrowReserve.userState!.borrowable.amount.value.times(
                  2,
                ),
              decimals:
                usedReserves.borrowReserve.asset.underlying.info.decimals,
            },
          )
            .andThen(() =>
              repay(client, {
                reserve: usedReserves.borrowReserve.id,
                sender: evmAddress(user.account.address),
                amount: {
                  erc20: {
                    value: {
                      max: true,
                    },
                  },
                },
              }),
            )
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction);

          assertOk(setup);
        });

        it('Then the health factor should be null', async () => {
          const summary = await userSummary(client, {
            user: evmAddress(user.account.address),
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });
          assertOk(summary);
          expect(summary.value.lowestHealthFactor).toBeNull();
        });
      });
    });
  });
});
