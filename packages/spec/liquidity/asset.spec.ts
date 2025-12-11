import { assertOk, Currency, TimeWindow } from '@aave/client';
import { asset } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Assets on Aave V4', () => {
  describe('Given a user who wants to fetch asset information', () => {
    describe('When fetching an asset by token address', () => {
      it('Then it should return the asset data for USDC token', async () => {
        const result = await asset(client, {
          query: {
            token: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_USDC_ADDRESS,
            },
          },
        });

        assertOk(result);
        expect(result.value).not.toBeNull();
        expect(result.value).toMatchObject({
          id: expect.any(String),
          token: expect.objectContaining({
            address: ETHEREUM_USDC_ADDRESS,
          }),
          summary: expect.any(Object),
          price: expect.any(Object),
        });
      });

      it('Then it should return the asset data for WETH token', async () => {
        const result = await asset(client, {
          query: {
            token: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_WETH_ADDRESS,
            },
          },
        });

        assertOk(result);
        expect(result.value).not.toBeNull();
        expect(result.value).toMatchObject({
          id: expect.any(String),
          token: expect.objectContaining({
            address: ETHEREUM_WETH_ADDRESS,
          }),
          summary: expect.any(Object),
          price: expect.any(Object),
        });
      });
    });

    describe('When fetching an asset with different currency options', () => {
      const currencies = Object.values(Currency);

      it.each(currencies)(
        'Then it should return asset price in %s',
        async (currency) => {
          const result = await asset(
            client,
            {
              query: {
                token: {
                  chainId: ETHEREUM_FORK_ID,
                  address: ETHEREUM_USDC_ADDRESS,
                },
              },
            },
            { currency },
          );

          assertOk(result);
          expect(result.value?.price.current.name).toBe(currency);
        },
      );
    });

    describe('When fetching an asset with different time window options', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return asset data with %s time window',
        async (timeWindow) => {
          const result = await asset(
            client,
            {
              query: {
                token: {
                  chainId: ETHEREUM_FORK_ID,
                  address: ETHEREUM_USDC_ADDRESS,
                },
              },
            },
            { timeWindow },
          );

          assertOk(result);
          // NOTE: timeWindow is only for price.change value so not possible to verify the window value is applied properly
          expect(result.value).toMatchObject({
            id: expect.any(String),
            token: expect.any(Object),
            summary: expect.any(Object),
            price: expect.any(Object),
          });
        },
      );
    });
  });
});
