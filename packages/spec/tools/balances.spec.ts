import {
  assertOk,
  bigDecimal,
  evmAddress,
  OrderDirection,
} from '@aave/client-next';
import { userBalances, userPositions } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDS_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { supplyToRandomERC20Reserve } from '../borrow/helper';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

// Get the user balances for the protocol. This will only return assets that can be used on the protocol
describe('Querying User Balances on Aave V4', () => {
  describe('Given a user with one supply position and multiple tokens to use on the protocol', () => {
    beforeAll(async () => {
      const setup = await fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('100'),
        decimals: 6,
      })
        .andThen(() =>
          fundErc20Address(evmAddress(user.account.address), {
            address: ETHEREUM_USDS_ADDRESS,
            amount: bigDecimal('100'),
          }),
        )
        .andThen(() =>
          fundErc20Address(evmAddress(user.account.address), {
            address: ETHEREUM_WSTETH_ADDRESS,
            amount: bigDecimal('100'),
          }),
        )
        .andThen(() =>
          supplyToRandomERC20Reserve(client, user, {
            token: ETHEREUM_WSTETH_ADDRESS,
            amount: bigDecimal('50'),
          }),
        );
      assertOk(setup);
    }, 60_000);

    describe('When the user queries balances by chain ID', () => {
      it('Then the balances of assets that can be used on the chain are returned', async () => {
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(balances);
        expect(balances.value.length).toBe(4);
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
        expect(balances.value.length).toBe(4);
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
        expect(balances.value.length).toBe(4);
      });
    });

    describe('When the user queries balances by swappable tokens on a specific chainId', () => {
      it('Then the balances of assets that can be swapped are returned', async () => {
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            swappable: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          },
        });
        assertOk(balances);
        expect(balances.value.length).toBe(4);
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
        assertSingleElementArray(positions.value);
        const balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            userPositionId: positions.value[0].id,
          },
        });
        assertOk(balances);
        expect(balances.value.length).toBe(4);
      });
    });

    describe('When the user fetches balances ordered by token name', () => {
      it('Then the balances are returned in order of token name', async () => {
        let balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { name: OrderDirection.Desc },
        });
        assertOk(balances);
        let listOrderName = balances.value.map((elem) => elem.info.name);
        expect(listOrderName).toBeOrderedAlphabetically('desc');

        balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { name: OrderDirection.Asc },
        });
        assertOk(balances);
        listOrderName = balances.value.map((elem) => elem.info.name);
        expect(listOrderName).toBeOrderedAlphabetically('asc');
      });
    });

    describe('When the user fetches balances ordered by balance amount', () => {
      it('Then the balances are returned in order of balance amount', async () => {
        let balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Desc },
        });
        assertOk(balances);
        let listOrderBalance = balances.value.map(
          (elem) => elem.totalAmount.value,
        );
        expect(listOrderBalance).toBeOrderedNumerically('desc');

        balances = await userBalances(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Asc },
        });
        assertOk(balances);
        listOrderBalance = balances.value.map((elem) => elem.totalAmount.value);
        expect(listOrderBalance).toBeOrderedNumerically('asc');
      });
    });
  });
});
