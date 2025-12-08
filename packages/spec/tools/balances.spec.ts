import { assertOk, bigDecimal, evmAddress, OrderDirection } from '@aave/client';
import { userBalances, userPositions } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_1INCH_ADDRESS,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReserveAndSupply } from '../helpers/supplyBorrow';
import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet(
  '0xb648cc3d9bdad37b60bcd7177b783a9c7ddfb36b6c7699f74f8dd27d4d150503',
);

// Get the user balances for the protocol. This will only return assets that can be used on the protocol
describe('Querying User Balances on Aave V4', () => {
  describe('Given a user with one supply position and multiple tokens to use on the protocol', () => {
    beforeAll(async () => {
      const balances = await userBalances(client, {
        user: evmAddress(user.account.address),
        filter: {
          chains: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        },
      });
      assertOk(balances);
      if (balances.value.length < 3) {
        for (const token of [ETHEREUM_USDC_ADDRESS, ETHEREUM_1INCH_ADDRESS]) {
          const result = await fundErc20Address(
            evmAddress(user.account.address),
            {
              address: token,
              amount: bigDecimal('100'),
              decimals: token === ETHEREUM_1INCH_ADDRESS ? 18 : 6,
            },
          ).andThen(() =>
            findReserveAndSupply(client, user, {
              token: token,
              amount: bigDecimal('50'),
              asCollateral: true,
            }),
          );
          assertOk(result);
        }
      }
    }, 60_000);

    describe('When the user queries balances by chain ID', () => {
      it('Then the balances of assets that can be used on the chain are returned', async () => {
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chains: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
        });
        assertOk(balances);
        expect(balances.value.length).toBe(3);
      });
    });

    describe('When the user queries balances by hub', () => {
      it('Then the balances of assets that can be used on the hub are returned', async () => {
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            hub: {
              address: ETHEREUM_HUB_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(balances);
        // NOTE: One less because 1INCH is not supported on the hub
        expect(balances.value.length).toBe(2);
      });
    });

    describe('When the user queries balances by spoke', () => {
      it('Then the balances of assets that can be used on the spoke are returned', async () => {
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            spoke: {
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(balances);
        // NOTE: One less because 1INCH is not supported on the spoke
        expect(balances.value.length).toBe(2);
      });
    });

    describe('When the user queries balances by swappable tokens on a specific chainId', () => {
      // TODO: this query needs to be fixed as it can take even 20 seconds to complete
      it.skip('Then the balances of assets that can be swapped are returned', async () => {
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            swappable: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
        });
        assertOk(balances);
        expect(balances.value.length).toBe(3);
      });
    });

    describe('When the user queries balances by user position ID', () => {
      it('Then the balances of assets that can be used on the user position are returned', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            userPosition: {
              userPositionId: positions.value[0].id,
            },
          },
        });
        assertOk(balances);
        expect(balances.value.length).toBe(2);
      });
    });

    describe('When the user fetches balances ordered by token name', () => {
      it('Then the balances are returned in order of token name', async () => {
        let balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chains: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
          orderBy: { name: OrderDirection.Desc },
        });
        assertOk(balances);
        let listOrderName = balances.value.map((elem) => elem.info.name);
        expect(listOrderName).toBeSortedAlphabetically('desc');

        balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chains: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
          orderBy: { name: OrderDirection.Asc },
        });
        assertOk(balances);
        listOrderName = balances.value.map((elem) => elem.info.name);
        expect(listOrderName).toBeSortedAlphabetically('asc');
      });
    });

    describe('When the user fetches balances ordered by balance amount', () => {
      it('Then the balances are returned in order of balance amount', async () => {
        let balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chains: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
          orderBy: { balance: OrderDirection.Desc },
        });
        assertOk(balances);
        let listOrderBalance = balances.value.map((elem) =>
          elem.balances.reduce(
            (sum, balance) => sum.plus(balance.fiatAmount.value),
            bigDecimal('0'),
          ),
        );
        expect(listOrderBalance).toBeSortedNumerically('desc');

        balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chains: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
          orderBy: { balance: OrderDirection.Asc },
        });
        assertOk(balances);
        listOrderBalance = balances.value.map((elem) =>
          elem.balances.reduce(
            (sum, balance) => sum.plus(balance.fiatAmount.value),
            bigDecimal('0'),
          ),
        );
        expect(listOrderBalance).toBeSortedNumerically('asc');
      });
    });
  });
});
