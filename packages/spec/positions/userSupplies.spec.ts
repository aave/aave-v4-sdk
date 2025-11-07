import { assertOk, evmAddress, OrderDirection } from '@aave/client-next';
import { userPositions, userSupplies } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
} from '@aave/client-next/test-utils';
import { encodeSpokeId } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet(
  '0x91e5f8c7bb59132f3b053615bec1d82e647bdcc49bc691fc602cdcb1b890416a',
);

describe('Querying User Supply Positions on Aave V4', () => {
  describe('Given a user with multiple active supply positions', () => {
    beforeAll(async () => {
      // NOTE: Enable when needed to create userSupplies position for a new user
      // const setup = await fundErc20Address(evmAddress(user.account.address), {
      //   address: ETHEREUM_WETH_ADDRESS,
      //   amount: bigDecimal('0.5'),
      // })
      //   .andThen(() =>
      //     supplyToRandomERC20Reserve(client, user, {
      //       token: ETHEREUM_WETH_ADDRESS,
      //       amount: bigDecimal('0.3'),
      //     }),
      //   )
      //   .andThen(() =>
      //     fundErc20Address(evmAddress(user.account.address), {
      //       address: ETHEREUM_USDC_ADDRESS,
      //       amount: bigDecimal('50'),
      //       decimals: 6,
      //     }),
      //   )
      //   .andThen(() =>
      //     supplyToRandomERC20Reserve(client, user, {
      //       token: ETHEREUM_USDC_ADDRESS,
      //       amount: bigDecimal('40'),
      //     }),
      //   )
      //   .andThen(() =>
      //     fundErc20Address(evmAddress(user.account.address), {
      //       address: ETHEREUM_USDS_ADDRESS,
      //       amount: bigDecimal('50'),
      //     }),
      //   )
      //   .andThen(() =>
      //     supplyToRandomERC20Reserve(client, user, {
      //       token: ETHEREUM_USDS_ADDRESS,
      //       amount: bigDecimal('40'),
      //     }),
      //   );
      // assertOk(setup);
    }, 120_000);

    describe('When the user queries their supply positions by spoke', () => {
      it('Then the matching supply positions are returned', async () => {
        const supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(supplyPositions);
        expect(supplyPositions.value.length).toBe(3);
        supplyPositions.value.forEach((position) => {
          expect(position.reserve.spoke.address).toBe(
            ETHEREUM_SPOKE_CORE_ADDRESS,
          );
        });
      });
    });

    describe('When the user queries their supply positions including zero balances', () => {
      it('Then all supply positions, including those with zero balances, are returned', async () => {
        let supplyPositions = await userSupplies(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
          includeZeroBalances: true,
        });
        assertOk(supplyPositions);
        expect(supplyPositions.value.length).toBeGreaterThan(3);
        supplyPositions.value.forEach((position) => {
          expect(position.reserve.spoke.chain.chainId).toBe(ETHEREUM_FORK_ID);
        });

        supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          includeZeroBalances: true,
        });
        assertOk(supplyPositions);
        expect(supplyPositions.value.length).toBeGreaterThan(3);
        supplyPositions.value.forEach((position) => {
          expect(position.reserve.spoke.address).toBe(
            ETHEREUM_SPOKE_CORE_ADDRESS,
          );
        });
      });
    });

    describe('When the user queries their supply positions by chain ID', () => {
      it('Then the supply positions matching the specified chain IDs are returned', async () => {
        const supplyPositions = await userSupplies(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(supplyPositions);
        expect(supplyPositions.value.length).toBe(3);
      });
    });

    describe('When the user queries a specific supply position by its ID', () => {
      it('Then the corresponding supply position is returned', async () => {
        const positions = await userPositions(client, {
          filter: { chainIds: [ETHEREUM_FORK_ID] },
          user: evmAddress(user.account.address),
        });
        assertOk(positions);
        // Select a random supply position
        assertNonEmptyArray(positions.value);
        positions.value.forEach((position) => {
          expect(position.spoke.chain.chainId).toBe(ETHEREUM_FORK_ID);
        });
        const supplyPositions = await userSupplies(client, {
          query: {
            userPositionId: positions.value[0].id,
          },
        });
        assertOk(supplyPositions);
        expect(supplyPositions.value.length).toBe(3);
      });
    });

    describe('When the user fetches supply positions ordered by amount', () => {
      it('Then the supply positions are returned in order of amount', async () => {
        let supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          orderBy: { amount: OrderDirection.Desc },
        });
        assertOk(supplyPositions);
        let listOrderAmount = supplyPositions.value.map(
          (elem) => elem.withdrawable.amount.value,
        );
        expect(listOrderAmount).toBeSortedNumerically('desc');

        supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          orderBy: { amount: OrderDirection.Asc },
        });
        assertOk(supplyPositions);
        listOrderAmount = supplyPositions.value.map(
          (elem) => elem.withdrawable.amount.value,
        );
        expect(listOrderAmount).toBeSortedNumerically('asc');
      });
    });

    describe('When the user fetches supply positions ordered by APY', () => {
      it('Then the supply positions are returned in order of APY', async () => {
        let supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          orderBy: { apy: OrderDirection.Desc },
        });
        assertOk(supplyPositions);
        let listOrderApy = supplyPositions.value.map(
          (elem) => elem.reserve.summary.supplyApy.value,
        );
        expect(listOrderApy).toBeSortedNumerically('desc');

        supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          orderBy: { apy: OrderDirection.Asc },
        });
        assertOk(supplyPositions);

        listOrderApy = supplyPositions.value.map(
          (elem) => elem.reserve.summary.supplyApy.value,
        );
        expect(listOrderApy).toBeSortedNumerically('asc');
      });
    });

    describe('When the user fetches supply positions ordered by asset name', () => {
      it('Then the supply positions are returned in order of asset name', async () => {
        let supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          orderBy: { assetName: OrderDirection.Desc },
        });
        assertOk(supplyPositions);
        let listOrderAssetName = supplyPositions.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetName).toBeSortedAlphabetically('desc');

        supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: encodeSpokeId({
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              }),

              user: evmAddress(user.account.address),
            },
          },
          orderBy: { assetName: OrderDirection.Asc },
        });
        assertOk(supplyPositions);
        listOrderAssetName = supplyPositions.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetName).toBeSortedAlphabetically('asc');
      });
    });
  });
});
