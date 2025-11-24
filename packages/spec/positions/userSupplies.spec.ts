import { assertOk, evmAddress, OrderDirection } from '@aave/client';
import { userPositions, userSupplies } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
} from '@aave/client/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';
import { recreateUserActivities } from './helper';

const user = await createNewWallet(
  '0x03f9dd1b3e99ec75cdacdeb397121d50751b87dde022f007406e6faefb14b3dc',
);

describe('Querying User Supply Positions on Aave V4', () => {
  describe('Given a user with multiple active supply positions', () => {
    beforeAll(async () => {
      // NOTE: Recreate user activities if needed
      await recreateUserActivities(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
      });
    }, 180_000);

    describe('When the user queries their supply positions by spoke', () => {
      it('Then the matching supply positions are returned', async () => {
        const supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(supplyPositions);

        expect(supplyPositions.value.length).toBe(3);
        expect(supplyPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                id: ETHEREUM_SPOKE_CORE_ID,
              }),
            }),
          }),
        );
      });
    });

    describe('When the user queries their supply positions by token', () => {
      it('Then the matching supply positions are returned', async () => {
        const supplyPositions = await userSupplies(client, {
          query: {
            userToken: {
              token: {
                chainId: ETHEREUM_FORK_ID,
                address: ETHEREUM_GHO_ADDRESS,
              },
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(supplyPositions);
        expect(supplyPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              asset: expect.objectContaining({
                underlying: expect.objectContaining({
                  address: ETHEREUM_GHO_ADDRESS,
                }),
              }),
            }),
          }),
        );
      });
    });

    describe('When the user queries their supply positions including zero balances', () => {
      it('Then all supply positions, including those with zero balances, are returned', async () => {
        const supplyPositions = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,

              user: evmAddress(user.account.address),
            },
          },
          includeZeroBalances: true,
        });
        assertOk(supplyPositions);

        expect(supplyPositions.value.length).toBeGreaterThan(3);
        expect(supplyPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                id: ETHEREUM_SPOKE_CORE_ID,
              }),
            }),
          }),
        );
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

        expect(supplyPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              spoke: expect.objectContaining({
                chain: expect.objectContaining({
                  chainId: ETHEREUM_FORK_ID,
                }),
              }),
            }),
          }),
        );
      });
    });

    describe('When the user queries a specific supply position by its ID', () => {
      it('Then the corresponding supply position is returned', async () => {
        const positions = await userPositions(client, {
          filter: { chainIds: [ETHEREUM_FORK_ID] },
          user: evmAddress(user.account.address),
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);

        // Select a random supply position
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
        const supplyPositionsDesc = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { amount: OrderDirection.Desc },
        });
        assertOk(supplyPositionsDesc);
        const listOrderAmountDesc = supplyPositionsDesc.value.map(
          (elem) => elem.principal.amount.value,
        );
        expect(listOrderAmountDesc).toBeSortedNumerically('desc');

        const supplyPositionsAsc = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { amount: OrderDirection.Asc },
        });
        assertOk(supplyPositionsAsc);
        const listOrderAmountAsc = supplyPositionsAsc.value.map(
          (elem) => elem.principal.amount.value,
        );
        expect(listOrderAmountAsc).toBeSortedNumerically('asc');
      });
    });

    describe('When the user fetches supply positions ordered by APY', () => {
      it('Then the supply positions are returned in order of APY', async () => {
        const supplyPositionsDesc = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { apy: OrderDirection.Desc },
        });
        assertOk(supplyPositionsDesc);
        const listOrderApyDesc = supplyPositionsDesc.value.map(
          (elem) => elem.reserve.summary.supplyApy.value,
        );
        expect(listOrderApyDesc).toBeSortedNumerically('desc');

        const supplyPositionsAsc = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { apy: OrderDirection.Asc },
        });
        assertOk(supplyPositionsAsc);
        const listOrderApyAsc = supplyPositionsAsc.value.map(
          (elem) => elem.reserve.summary.supplyApy.value,
        );
        expect(listOrderApyAsc).toBeSortedNumerically('asc');
      });
    });

    describe('When the user fetches supply positions ordered by asset name', () => {
      it('Then the supply positions are returned in order of asset name', async () => {
        const supplyPositionsDesc = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { assetName: OrderDirection.Desc },
        });
        assertOk(supplyPositionsDesc);

        const listOrderAssetNameDesc = supplyPositionsDesc.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetNameDesc).toBeSortedAlphabetically('desc');

        const supplyPositionsAsc = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              user: evmAddress(user.account.address),
            },
          },
          orderBy: { assetName: OrderDirection.Asc },
        });
        assertOk(supplyPositionsAsc);

        const listOrderAssetNameAsc = supplyPositionsAsc.value.map(
          (elem) => elem.reserve.asset.underlying.info.name,
        );
        expect(listOrderAssetNameAsc).toBeSortedAlphabetically('asc');
      });
    });
  });
});
