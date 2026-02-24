import { assertOk, BigDecimal, Currency, TimeWindow } from '@aave/client';
import { assetPriceHistory } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../helpers/tools';

describe('Querying Asset Price History on Aave V4', () => {
  describe('Given an asset/token available on the protocol', () => {
    describe('When fetching the asset price history with a specific currency', () => {
      const currencies = Object.values(Currency);

      it.each(currencies)(
        'Then it should return the asset price history in %s',
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

    describe('When fetching the asset price history with a specific time window', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return the asset price history for the %s time window',
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
