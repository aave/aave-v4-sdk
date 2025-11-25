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
      await recreateUserPositions(client, user);
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
        assertNonEmptyArray(positions.value);

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
        const positionsBalanceDesc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Desc },
        });
        assertOk(positionsBalanceDesc);

        const listOrderBalanceDesc = positionsBalanceDesc.value.map(
          (elem) => elem.netBalance.current.value,
        );
        expect(listOrderBalanceDesc).toBeSortedNumerically('desc');

        const positionsBalanceAsc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { balance: OrderDirection.Asc },
        });
        assertOk(positionsBalanceAsc);

        const listOrderBalanceAsc = positionsBalanceAsc.value.map(
          (elem) => elem.netBalance.current.value,
        );
        expect(listOrderBalanceAsc).toBeSortedNumerically('asc');
      });

      it('Then it should return the positions ordered by apy', async () => {
        const positionsApyDesc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netApy: OrderDirection.Desc },
        });
        assertOk(positionsApyDesc);

        const listOrderApyDesc = positionsApyDesc.value.map(
          (elem) => elem.netApy.value,
        );
        expect(listOrderApyDesc).toBeSortedNumerically('desc');

        const positionsApyAsc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netApy: OrderDirection.Asc },
        });
        assertOk(positionsApyAsc);

        const listOrderApyAsc = positionsApyAsc.value.map(
          (elem) => elem.netApy.value,
        );
        expect(listOrderApyAsc).toBeSortedNumerically('asc');
      });

      it('Then it should return the positions ordered by healthFactor', async () => {
        const positionsHealthFactorDesc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { healthFactor: OrderDirection.Desc },
        });
        assertOk(positionsHealthFactorDesc);

        const listOrderHealthFactorDesc = positionsHealthFactorDesc.value.map(
          (elem) => elem.healthFactor.current,
        );
        expect(listOrderHealthFactorDesc).toBeSortedNumerically('desc');

        const positionsHealthFactorAsc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { healthFactor: OrderDirection.Asc },
        });
        assertOk(positionsHealthFactorAsc);

        const listOrderHealthFactorAsc = positionsHealthFactorAsc.value.map(
          (elem) => elem.healthFactor.current,
        );
        expect(listOrderHealthFactorAsc).toBeSortedNumerically('asc');
      });

      it('Then it should return the positions ordered by created', async () => {
        const positionsCreatedDesc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { created: OrderDirection.Desc },
        });
        assertOk(positionsCreatedDesc);

        const listOrderCreatedDesc = positionsCreatedDesc.value.map(
          (elem) => elem.createdAt,
        );
        expect(listOrderCreatedDesc).toBeSortedByDate('desc');

        const positionsCreatedAsc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { created: OrderDirection.Asc },
        });
        assertOk(positionsCreatedAsc);

        const listOrderCreatedAsc = positionsCreatedAsc.value.map(
          (elem) => elem.createdAt,
        );
        expect(listOrderCreatedAsc).toBeSortedByDate('asc');
      });

      it('Then it should return the positions ordered by netCollateral', async () => {
        const positionsNetCollateralDesc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netCollateral: OrderDirection.Desc },
        });
        assertOk(positionsNetCollateralDesc);

        const listOrderNetCollateralDesc = positionsNetCollateralDesc.value.map(
          (elem) => elem.netCollateral.current.value,
        );
        expect(listOrderNetCollateralDesc).toBeSortedNumerically('desc');

        const positionsNetCollateralAsc = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { netCollateral: OrderDirection.Asc },
        });
        assertOk(positionsNetCollateralAsc);

        const listOrderNetCollateralAsc = positionsNetCollateralAsc.value.map(
          (elem) => elem.netCollateral.current.value,
        );
        expect(listOrderNetCollateralAsc).toBeSortedNumerically('asc');
      });
    });
  });
});
