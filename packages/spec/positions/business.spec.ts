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
  ETHEREUM_USDS_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  supplyToRandomERC20Reserve,
  supplyToReserve,
} from '../helpers/supplyBorrow';
import { supplyAndBorrow } from '../repay/helper';

const user = await createNewWallet();

describe('Aave V4 Health Factor Positions Scenarios', () => {
  describe('Given a user with a one supply position as collateral', () => {
    describe('When the user checks the health factor', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('0.5'),
        }).andThen(() =>
          supplyToRandomERC20Reserve(client, user, {
            token: ETHEREUM_WSTETH_ADDRESS,
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
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WSTETH_ADDRESS,
          amount: bigDecimal('0.5'),
        })
          .andThen(() =>
            fundErc20Address(evmAddress(user.account.address), {
              address: ETHEREUM_USDS_ADDRESS,
              amount: bigDecimal('500'),
            }),
          )
          .andThen(() =>
            supplyAndBorrow(client, user, {
              tokenToSupply: ETHEREUM_WSTETH_ADDRESS,
              tokenToBorrow: ETHEREUM_USDS_ADDRESS,
            }),
          );

        assertOk(setup);
        usedReserves = setup.value;
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
            reserve: {
              spoke: usedReserves.supplyReserve.spoke.address,
              reserveId: usedReserves.supplyReserve.id,
              chainId: usedReserves.supplyReserve.chain.chainId,
            },
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
            reserve: {
              spoke: usedReserves.borrowReserve.spoke.address,
              reserveId: usedReserves.borrowReserve.id,
              chainId: usedReserves.borrowReserve.chain.chainId,
            },
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
            reserve: {
              spoke: usedReserves.borrowReserve.spoke.address,
              reserveId: usedReserves.borrowReserve.id,
              chainId: usedReserves.borrowReserve.chain.chainId,
            },
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
            reserve: {
              spoke: usedReserves.supplyReserve.spoke.address,
              reserveId: usedReserves.supplyReserve.id,
              chainId: usedReserves.supplyReserve.chain.chainId,
            },
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
            reserve: {
              spoke: usedReserves.borrowReserve.spoke.address,
              reserveId: usedReserves.borrowReserve.id,
              chainId: usedReserves.borrowReserve.chain.chainId,
            },
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
