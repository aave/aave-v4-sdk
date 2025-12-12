import { assertOk, TimeWindow } from '@aave/client';
import { assetSupplyHistory } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../../helpers/tools';

describe('Querying Asset Supply Apy History on Aave V4', () => {
  describe('Given an asset/token available on the protocol', () => {
    describe('When fetching the asset apy supply history', () => {
      it('Then it should return the asset apy supply history', async () => {
        const result = await assetSupplyHistory(client, {
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
            __typename: 'AssetSupplySample',
            date: expect.any(Date),
            amount: expect.any(Object),
            highestApy: expect.any(Object),
            lowestApy: expect.any(Object),
          }),
        );
      });
    });

    describe('When fetching the asset apy supply history with a specific time window', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return the asset apy supply history for the %s time window',
        async (window) => {
          const result = await assetSupplyHistory(client, {
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
              __typename: 'AssetSupplySample',
              date: expect.toBeBetweenDates(startDate, now),
              amount: expect.any(Object),
              highestApy: expect.any(Object),
              lowestApy: expect.any(Object),
            }),
          );
        },
      );
    });
  });
});
