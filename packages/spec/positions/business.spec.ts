import {
  assertOk,
  type BigDecimal,
  bigDecimal,
  evmAddress,
  type Reserve,
} from '@aave/client-next';
import {
  borrow,
  repay,
  userSummary,
  withdraw,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
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

describe('Aave V4 Health Factor Positions Scenarios', () => {
  describe('Given a user with a one supply position as collateral', () => {
    describe('When the user checks the health factor', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('0.5'),
        }).andThen(() =>
          findReserveAndSupply(client, user, {
            token: ETHEREUM_WSTETH_ADDRESS,
            spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
            asCollateral: true,
            amount: bigDecimal('0.3'),
          }),
        );

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
          spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
        });
        assertOk(reservesToBorrow);

        const setup = await findReservesToSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
          asCollateral: true,
        }).andThen((reservesToSupply) =>
          fundErc20Address(evmAddress(user.account.address), {
            address: reservesToSupply[0].asset.underlying.address,
            amount: bigDecimal('0.2'),
            decimals: reservesToSupply[0].asset.underlying.info.decimals,
          })
            .andThen(() =>
              supplyAndBorrow(client, user, {
                reserveToSupply: reservesToSupply[0],
                amountToSupply: bigDecimal('0.1'),
                reserveToBorrow: reservesToBorrow.value[0],
                ratioToBorrow: 0.1,
              }),
            )
            .map(() => ({
              borrowReserve: reservesToBorrow.value[0],
              supplyReserve: reservesToSupply[0],
            })),
        );
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

          const setup = await supplyToReserve(client, user, {
            amount: { erc20: { value: bigDecimal('0.1') } },
            reserve: usedReserves.supplyReserve.id,
            enableCollateral: true,
            sender: evmAddress(user.account.address),
          });

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

          const setup = await repay(client, {
            reserve: usedReserves.borrowReserve.id,
            sender: evmAddress(user.account.address),
            amount: {
              erc20: {
                value: {
                  exact: bigDecimal('100'),
                },
              },
            },
          })
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
                value: bigDecimal('50'),
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

          const setup = await withdraw(client, {
            reserve: usedReserves.supplyReserve.id,
            sender: evmAddress(user.account.address),
            amount: {
              erc20: {
                exact: bigDecimal('0.02'),
              },
            },
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction);

          assertOk(setup);
        });

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
          const setup = await repay(client, {
            reserve: usedReserves.borrowReserve.id,
            sender: evmAddress(user.account.address),
            amount: {
              erc20: {
                value: {
                  max: true,
                },
              },
            },
          })
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
