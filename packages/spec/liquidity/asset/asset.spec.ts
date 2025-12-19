import { assertOk } from '@aave/client';
import { asset } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Assets on Aave V4', () => {
  describe('Given an asset/token available on the protocol', () => {
    describe('When fetching the asset data', () => {
      it('Then it should return the asset data', async () => {
        const result = await asset(client, {
          query: {
            token: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_USDC_ADDRESS,
            },
          },
        });
        assertOk(result);
        expect(result.value).toMatchObject({
          id: expect.any(String),
          token: expect.objectContaining({
            address: ETHEREUM_USDC_ADDRESS,
            chain: expect.objectContaining({
              chainId: ETHEREUM_FORK_ID,
            }),
          }),
          summary: expect.any(Object),
          price: expect.any(Object),
        });
      });
    });
  });
});
