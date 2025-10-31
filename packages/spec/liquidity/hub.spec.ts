import { assertOk } from '@aave/client-next';
import { hub, hubAssets, hubs } from '@aave/client-next/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_TOKENS,
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
      const tokens = [ETHEREUM_TOKENS.USDC, ETHEREUM_TOKENS.WETH];

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

        for (const hub of listHubs.value) {
          const result = await hubAssets(client, {
            chainId: ETHEREUM_FORK_ID,
            hub: hub.address,
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
          hub: listHubs.value[0].address,
          chainId: ETHEREUM_FORK_ID,
        });
        assertOk(result);
        expect(result.value).toMatchObject(listHubs.value[0]);
      });
    });
  });

  describe('Given a user who wants to know assets in a hub', () => {
    describe('When fetching assets in a hub', () => {
      it('Then it should return the expected data for assets in a hub', async () => {
        const listHubs = await hubs(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });

        assertOk(listHubs);
        assertNonEmptyArray(listHubs.value);

        const result = await hubAssets(client, {
          hub: listHubs.value[0].address,
          chainId: ETHEREUM_FORK_ID,
        });
        assertOk(result);
        assertNonEmptyArray(result.value);
        result.value.forEach((asset) => {
          expect(asset).toMatchSnapshot({
            hub: expect.any(Object),
            summary: expect.any(Object),
          });
          expect(asset.hub.address).toBe(listHubs.value[0]!.address);
        });
      });
    });
  });
});
