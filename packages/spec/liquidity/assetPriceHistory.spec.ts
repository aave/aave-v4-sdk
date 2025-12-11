import { assertOk, BigDecimal, Currency, TimeWindow } from '@aave/client';
import { assetPriceHistory } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../helpers/tools';

describe('Querying Asset Price History on Aave V4', () => {
  describe('Given a user who wants to fetch asset price history', () => {
    describe('When fetching price history by token address', () => {
      it('Then it should return price history for USDC token', async () => {
        const result = await assetPriceHistory(client, {
          query: {
            token: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_USDC_ADDRESS,
            },
          },
        });

        assertOk(result);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: 'AssetPriceSample',
            date: expect.any(Date),
            price: expect.any(BigDecimal),
          }),
        );
      });

      it('Then it should return price history for WETH token', async () => {
        const result = await assetPriceHistory(client, {
          query: {
            token: {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_WETH_ADDRESS,
            },
          },
        });

        assertOk(result);
        expect(result.value).toBeArrayWithElements(
          expect.objectContaining({
            __typename: 'AssetPriceSample',
            date: expect.any(Date),
            price: expect.any(BigDecimal),
          }),
        );
      });
    });

    describe('When fetching price history with different currency options', () => {
      const currencies = Object.values(Currency);

      it.each(currencies)(
        'Then it should return price history in %s',
        async (currency) => {
          const result = await assetPriceHistory(client, {
            query: {
              token: {
                chainId: ETHEREUM_FORK_ID,
                address: ETHEREUM_USDC_ADDRESS,
              },
            },
            currency: currency,
          });

          assertOk(result);
          expect(result.value).toBeArrayWithElements(
            expect.objectContaining({
              __typename: 'AssetPriceSample',
              date: expect.any(Date),
              price: expect.any(BigDecimal),
            }),
          );
        },
      );
    });

    describe('When fetching price history with different time window options', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return price history for %s time window',
        async (window) => {
          const result = await assetPriceHistory(client, {
            query: {
              token: {
                chainId: ETHEREUM_FORK_ID,
                address: ETHEREUM_USDC_ADDRESS,
              },
            },
            window: window,
          });

          assertOk(result);
          const { now, startDate } = getTimeWindowDates(window);
          expect(result.value).toBeArrayWithElements(
            expect.objectContaining({
              __typename: 'AssetPriceSample',
              date: expect.toBeBetweenDates(startDate, now),
              price: expect.any(BigDecimal),
            }),
          );
        },
      );
    });
  });
});
