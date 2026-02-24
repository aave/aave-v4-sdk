import { assertOk } from '@aave/client';
import { reserves, spokes } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ID,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Spokes on Aave V4', () => {
  describe('Given a user who wants to fetch spokes by chain ID', () => {
    it('Then it should return the spokes', async () => {
      const spokesResult = await spokes(client, {
        query: {
          chainIds: [ETHEREUM_FORK_ID],
        },
      });
      assertOk(spokesResult);
      expect(spokesResult.value).toBeArrayWithElements(
        expect.objectContaining({
          address: expect.any(String),
          chain: expect.objectContaining({
            chainId: ETHEREUM_FORK_ID,
          }),
          id: expect.any(String),
          name: expect.any(String),
        }),
      );
    });
  });

  describe('Given a user who wants to fetch spokes by hub', () => {
    it('Then it should return the spokes for the specified hub', async () => {
      const spokesResult = await spokes(client, {
        query: {
          hubId: ETHEREUM_HUB_CORE_ID,
        },
      });
      assertOk(spokesResult);
      expect(spokesResult.value).toBeArrayWithElements(
        expect.objectContaining({
          address: expect.any(String),
          chain: expect.any(Object),
          id: expect.any(String),
          name: expect.any(String),
        }),
      );

      // Note: Not possible to check spoke - hub relationship directly
      // We need to check through the reserves
      for (const spoke of spokesResult.value) {
        const reservesResult = await reserves(client, {
          query: { spokeId: spoke.id },
        });
        assertOk(reservesResult);
        expect(reservesResult.value.length).toBeGreaterThan(0);

        const hasMatchingHub = reservesResult.value.some(
          (reserve) => reserve.asset.hub.id === ETHEREUM_HUB_CORE_ID,
        );
        expect(hasMatchingHub).toBe(true);
      }
    });
  });
});
