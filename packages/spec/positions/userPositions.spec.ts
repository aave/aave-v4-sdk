import { assertOk, evmAddress, OrderDirection } from '@aave/client';
import {
  userPosition,
  userPositions,
  userSupplies,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_SPOKE_ETHENA_ID,
} from '@aave/client/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';
import { recreateUserPositions } from './helper';

const user = await createNewWallet(
  '0x3bbb745c15f3b0daf1be54fb7b8281cc8eaac0249a28a4442052ebb0061e660d',
);

describe('Querying User Positions on Aave V4', () => {
  describe('Given a user with more than one position', () => {
    beforeAll(async () => {
      // NOTE: Recreate user activities if needed
      await recreateUserPositions(client, user, {
        spokeFirstPosition: ETHEREUM_SPOKE_CORE_ID,
        spokeSecondPosition: ETHEREUM_SPOKE_ETHENA_ID,
      });
    }, 180_000);

    describe('When fetching a specific position', () => {
      it('Then it should return the position details', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);

        for (const position of positions.value) {
          const positionDetails = await userPosition(client, {
            id: position.id,
          });
          assertOk(positionDetails);
          expect(positionDetails.value?.id).toBe(position.id);
        }
      });
    });

    describe('When fetching positions filtered by chainId', () => {
      it('Then it should return the positions filtered by chainId', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);

        expect(positions.value).toBeArrayWithElements(
          expect.objectContaining({
            spoke: expect.objectContaining({
              chain: expect.objectContaining({
                chainId: ETHEREUM_FORK_ID,
              }),
            }),
          }),
        );
      });
    });

    describe('When fetching positions filtered by token', () => {
      it('Then it should return the positions filtered by token', async () => {
        const suppliesPositions = await userSupplies(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(suppliesPositions);
        assertNonEmptyArray(suppliesPositions.value);

        const tokenPositions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            tokens: [
              {
                chainId: ETHEREUM_FORK_ID,
                address:
                  suppliesPositions.value[0].reserve.asset.underlying.address,
              },
            ],
          },
        });
        assertOk(tokenPositions);

        expect(tokenPositions.value).toBeArrayWithElements(
          expect.objectContaining({
            spoke: expect.objectContaining({
              chain: expect.objectContaining({
                chainId: ETHEREUM_FORK_ID,
              }),
            }),
          }),
        );
      });
    });

    describe('When fetching positions ordered by', () => {
      it('Then it should return the positions ordered by balance', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Desc },
        });
        assertOk(positions);

        let listOrderBalance = positions.value.map(
          (elem) => elem.netBalance.current.value,
        );
        expect(listOrderBalance).toBeSortedNumerically('desc');

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Asc },
        });
        assertOk(positions);

        listOrderBalance = positions.value.map(
          (elem) => elem.netBalance.current.value,
        );
        expect(listOrderBalance).toBeSortedNumerically('asc');
      });

      it('Then it should return the positions ordered by apy', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netApy: OrderDirection.Desc },
        });
        assertOk(positions);

        let listOrderApy = positions.value.map((elem) => elem.netApy.value);
        expect(listOrderApy).toBeSortedNumerically('desc');

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netApy: OrderDirection.Asc },
        });
        assertOk(positions);

        listOrderApy = positions.value.map((elem) => elem.netApy.value);
        expect(listOrderApy).toBeSortedNumerically('asc');
      });

      it('Then it should return the positions ordered by healthFactor', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { healthFactor: OrderDirection.Desc },
        });
        assertOk(positions);

        let listOrderHealthFactor = positions.value.map(
          (elem) => elem.healthFactor.current,
        );
        expect(listOrderHealthFactor).toBeSortedNumerically('desc');

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { healthFactor: OrderDirection.Asc },
        });
        assertOk(positions);

        listOrderHealthFactor = positions.value.map(
          (elem) => elem.healthFactor.current,
        );
        expect(listOrderHealthFactor).toBeSortedNumerically('asc');
      });

      it('Then it should return the positions ordered by created', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { created: OrderDirection.Desc },
        });
        assertOk(positions);

        let listOrderCreated = positions.value.map((elem) => elem.createdAt);
        expect(listOrderCreated).toBeSortedByDate('desc');

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { created: OrderDirection.Asc },
        });
        assertOk(positions);

        listOrderCreated = positions.value.map((elem) => elem.createdAt);
        expect(listOrderCreated).toBeSortedByDate('asc');
      });

      it('Then it should return the positions ordered by netCollateral', async () => {
        let positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netCollateral: OrderDirection.Desc },
        });
        assertOk(positions);

        let listOrderNetCollateral = positions.value.map(
          (elem) => elem.netCollateral.current.value,
        );
        expect(listOrderNetCollateral).toBeSortedNumerically('desc');

        positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netCollateral: OrderDirection.Asc },
        });
        assertOk(positions);

        listOrderNetCollateral = positions.value.map(
          (elem) => elem.netCollateral.current.value,
        );
        expect(listOrderNetCollateral).toBeSortedNumerically('asc');
      });
    });
  });
});
