import { assertOk, Currency, TimeWindow } from '@aave/client';
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
          }),
          summary: expect.any(Object),
          price: expect.any(Object),
        });
      });
    });

    describe('When fetching the asset price with a specific currency', () => {
      const currencies = Object.values(Currency);

      it.each(currencies)(
        'Then it should return the asset price in %s',
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

    describe('When fetching the asset with a specific time window', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return the asset price change for the %s window',
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
          // NOTE: timeWindow is only for price.change value, so it's not possible to verify the window value is applied properly
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
