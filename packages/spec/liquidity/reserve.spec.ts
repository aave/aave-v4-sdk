import {
  assertOk,
  OrderDirection,
  ReservesRequestFilter,
} from '@aave/client-next';
import { reserves } from '@aave/client-next/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client-next/test-utils';
import { describe, expect, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';

describe('Aave V4 Reserve Scenario', () => {
  describe('Given a user who wants to fetch reserves', () => {
    describe('When fetching reserves for a specific hub token', () => {
      it('Then it should return the reserves for the specific token', async () => {
        const listReserves = await reserves(client, {
          query: {
            hubToken: {
              token: ETHEREUM_USDC_ADDRESS,
              hub: ETHEREUM_HUB_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.asset.hub.address).toEqual(ETHEREUM_HUB_CORE_ADDRESS);
          expect(elem.asset.underlying.address).toEqual(ETHEREUM_USDC_ADDRESS);
        });
      });
    });

    describe('When fetching reserves for a specific spoke token', () => {
      it('Then it should return the reserves for the specific token', async () => {
        const listReserves = await reserves(client, {
          query: {
            spokeToken: {
              token: ETHEREUM_USDC_ADDRESS,
              spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.spoke.address).toEqual(ETHEREUM_SPOKE_CORE_ADDRESS);
          expect(elem.asset.underlying.address).toEqual(ETHEREUM_USDC_ADDRESS);
        });
      });
    });

    describe('When fetching reserves for a specific spoke', () => {
      it('Then it should return the reserves for that specific spoke', async () => {
        const listReserves = await reserves(client, {
          query: {
            spoke: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.spoke.address).toEqual(ETHEREUM_SPOKE_CORE_ADDRESS);
        });
      });
    });

    describe('When fetching reserves for a specific tokens', () => {
      it('Then it should return the reserves for the specific tokens', async () => {
        const tokens = [ETHEREUM_USDC_ADDRESS, ETHEREUM_WETH_ADDRESS];
        const listReserves = await reserves(client, {
          query: {
            tokens: tokens.map((token) => ({
              chainId: ETHEREUM_FORK_ID,
              address: token,
            })),
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(tokens.includes(elem.asset.underlying.address)).toBe(true);
        });
      });
    });

    describe('When fetching reserves for a specific chainId', () => {
      it('Then it should return the reserves for the specific chainId', async () => {
        const listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.chain.chainId).toEqual(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When fetching reserves for a specific hub', () => {
      it('Then it should return the reserves for the specific hub', async () => {
        const listReserves = await reserves(client, {
          query: {
            hub: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_HUB_CORE_ADDRESS,
            },
          },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        listReserves.value.forEach((elem) => {
          expect(elem.asset.hub.address).toEqual(ETHEREUM_HUB_CORE_ADDRESS);
        });
      });
    });

    describe('When fetching reserves ordered by', () => {
      // TODO: Code is not implemented in the backend yet
      it.skip('Then it should return reserves ordered by assetName', async () => {
        let listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { assetName: OrderDirection.Asc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);

        const listNamesAsc = listReserves.value.map(
          (elem) => elem.asset.underlying.info.name,
        );
        expect(listNamesAsc).toEqual(listNamesAsc.sort());

        listReserves = await reserves(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { assetName: OrderDirection.Desc },
        });
        assertOk(listReserves);
        assertNonEmptyArray(listReserves.value);
        const listNamesDesc = listReserves.value.map(
          (elem) => elem.asset.underlying.info.name,
        );
        expect(listNamesDesc).toEqual(listNamesDesc.sort().reverse());
      });

      it.todo('Then it should return reserves ordered by borrowApy');
      it.todo('Then it should return reserves ordered by supplyApy');
      it.todo('Then it should return reserves ordered by collateralFactor');
      it.todo('Then it should return reserves ordered by userBalance');
    });

    describe('When fetching reserves filtered by', () => {
      const status = Object.values(ReservesRequestFilter);
      it.each(status)(
        'Then it should return only reserves with a status: %s',
        async (status) => {
          const listReserves = await reserves(client, {
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
            filter: status,
          });
          assertOk(listReserves);
          assertNonEmptyArray(listReserves.value);

          listReserves.value.forEach((elem) => {
            if (status === ReservesRequestFilter.Borrow) {
              expect(elem.canBorrow).toBeTrue();
            }
            if (status === ReservesRequestFilter.Supply) {
              expect(elem.canSupply).toBeTrue();
            }
          });
        },
      );
    });
  });
});
