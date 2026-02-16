import { assertOk, OrderDirection } from '@aave/client';
import { hub, hubAssets, hubs } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';

describe('Querying Hubs on Aave V4', () => {
  describe('Given a user who wants to list available hubs', () => {
    describe('When fetching hubs by chain ID(s)', () => {
      it('Then it should return the expected data for each hub', async () => {
        const result = await hubs(client, {
          query: { chainIds: [ETHEREUM_FORK_ID] },
        });
        assertOk(result);
        result.value.forEach((hub) => {
          expect(hub).toMatchSnapshot({
            address: expect.any(String),
            chain: {
              chainId: ETHEREUM_FORK_ID,
              explorerUrl: expect.any(String),
              icon: expect.any(String),
              isFork: expect.any(Boolean),
              isTestnet: expect.any(Boolean),
              name: expect.any(String),
              nativeGateway: expect.any(String),
              nativeInfo: expect.any(Object),
              rpcUrl: expect.any(String),
              signatureGateway: expect.any(String),
            },
            id: expect.any(String),
            name: expect.any(String),
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
          const result = await hubAssets(client, {
            query: { hubId: hub.id },
          });
          assertOk(result);
          const assetsInHub = result.value.map(
            (asset) => asset.underlying.address,
          );
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

        const result = await hub(client, {
          query: { hubId: listHubs.value[0].id },
        });
        assertOk(result);
        expect(result.value).toMatchObject({
          id: listHubs.value[0].id,
          name: listHubs.value[0].name,
          address: listHubs.value[0].address,
          chain: listHubs.value[0].chain,
          summary: expect.any(Object),
        });
      });
    });

    describe('Given a user who wants to list available hubs', () => {
      describe('When fetching hubs sorted by name', () => {
        it('Then it should return the hubs sorted by name', async () => {
          const listHubsAsc = await hubs(client, {
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
            orderBy: { name: OrderDirection.Asc },
          });

          assertOk(listHubsAsc);
          const listHubsNameAsc = listHubsAsc.value.map((hub) => hub.name);
          expect(listHubsNameAsc).toBeSortedAlphabetically('asc');

          const listHubsDesc = await hubs(client, {
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
            orderBy: { name: OrderDirection.Desc },
          });
          assertOk(listHubsDesc);
          const listHubsNameDesc = listHubsDesc.value.map((hub) => hub.name);
          expect(listHubsNameDesc).toBeSortedAlphabetically('desc');
        });
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
          (hub) => hub.summary.totalBorrowed.current.value,
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
          (hub) => hub.summary.totalBorrowed.current.value,
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
          (hub) => hub.summary.totalSupplied.current.value,
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
          (hub) => hub.summary.totalSupplied.current.value,
        );
        expect(listHubsTotalSupplied).toBeSortedNumerically('desc');
      });
    });
  });
});
