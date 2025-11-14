import { assertOk, OrderDirection } from '@aave/client-next';
import { hub, hubAssets, hubs } from '@aave/client-next/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client-next/test-utils';
import { describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';

describe('Aave V4 Hub Scenarios', () => {
  describe('Given a user who wants to list available hubs', () => {
    describe('When fetching hubs by chain ID(s)', () => {
      it('Then it should return the expected data for each hub', async () => {
        const result = await hubs(client, {
          query: { chainIds: [ETHEREUM_FORK_ID] },
        });
        assertOk(result);
        result.value.forEach((hub) => {
          expect(hub).toMatchSnapshot({
            summary: expect.any(Object),
          });
        });
      });
    });

    describe('When fetching hubs by tokens)', () => {
      const tokens = [ETHEREUM_USDC_ADDRESS, ETHEREUM_WETH_ADDRESS];

      it('Then the list of hubs should contains assets from the query', async () => {
        const listHubs = await hubs(client, {
          query: {
            tokens: tokens.map((token) => ({
              address: token,
              chainId: ETHEREUM_FORK_ID,
            })),
          },
        });
        assertOk(listHubs);
        assertNonEmptyArray(listHubs.value);

        for (const hub of listHubs.value) {
          let result = await hubAssets(client, {
            query: { hubId: hub.id },
          });
          assertOk(result);
          let assetsInHub = result.value.map(
            (asset) => asset.underlying.address,
          );
          expect(tokens.some((token) => assetsInHub.includes(token))).toBe(
            true,
          );

          result = await hubAssets(client, {
            query: {
              hubInput: { address: hub.address, chainId: ETHEREUM_FORK_ID },
            },
          });
          assertOk(result);
          assetsInHub = result.value.map((asset) => asset.underlying.address);
          expect(tokens.some((token) => assetsInHub.includes(token))).toBe(
            true,
          );
        }
      });
    });
  });

  describe('Given a user who wants to fetch a single hub', () => {
    describe('When fetching a single hub', () => {
      it('Then it should return the expected data for the hub', async () => {
        const listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(listHubs);
        assertNonEmptyArray(listHubs.value);

        let result = await hub(client, {
          query: { hubId: listHubs.value[0].id },
        });
        assertOk(result);
        expect(result.value).toMatchObject(listHubs.value[0]);

        result = await hub(client, {
          query: {
            hubInput: {
              address: listHubs.value[0].address,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(result);
        expect(result.value).toMatchObject(listHubs.value[0]);
      });
    });
  });

  describe('Given a user who wants to list available hubs', () => {
    describe('When fetching hubs sorted by name', () => {
      it('Then it should return the hubs sorted by name', async () => {
        let listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { name: OrderDirection.Asc },
        });

        assertOk(listHubs);
        let listHubsName = listHubs.value.map((hub) => hub.name);
        expect(listHubsName).toBeSortedAlphabetically('asc');

        listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { name: OrderDirection.Desc },
        });
        assertOk(listHubs);
        listHubsName = listHubs.value.map((hub) => hub.name);
        expect(listHubsName).toBeSortedAlphabetically('desc');
      });
    });

    describe('When fetching hubs sorted by total borrowed', () => {
      it('Then it should return the hubs sorted by total borrowed', async () => {
        let listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { totalBorrowed: OrderDirection.Asc },
        });

        assertOk(listHubs);
        let listHubsTotalBorrowed = listHubs.value.map(
          (hub) => hub.summary.totalBorrowed.value,
        );
        expect(listHubsTotalBorrowed).toBeSortedNumerically('asc');

        listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { totalBorrowed: OrderDirection.Desc },
        });
        assertOk(listHubs);
        listHubsTotalBorrowed = listHubs.value.map(
          (hub) => hub.summary.totalBorrowed.value,
        );
        expect(listHubsTotalBorrowed).toBeSortedNumerically('desc');
      });
    });

    describe('When fetching hubs sorted by total supplied', () => {
      it('Then it should return the hubs sorted by total supplied', async () => {
        let listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { totalSupplied: OrderDirection.Asc },
        });

        assertOk(listHubs);
        let listHubsTotalSupplied = listHubs.value.map(
          (hub) => hub.summary.totalSupplied.value,
        );
        expect(listHubsTotalSupplied).toBeSortedNumerically('asc');

        listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          orderBy: { totalSupplied: OrderDirection.Desc },
        });
        assertOk(listHubs);
        listHubsTotalSupplied = listHubs.value.map(
          (hub) => hub.summary.totalSupplied.value,
        );
        expect(listHubsTotalSupplied).toBeSortedNumerically('desc');
      });
    });
  });
});
