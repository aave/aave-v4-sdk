import { assertOk, TimeWindow } from '@aave/client';
import { assetSupplyHistory } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../helpers/tools';

describe('Querying Asset Supply History on Aave V4', () => {
  describe('Given a user who wants to fetch asset supply history', () => {
    describe('When fetching supply history by token address', () => {
      it('Then it should return supply history for USDC token', async () => {
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

      it('Then it should return supply history for WETH token', async () => {
        const result = await assetSupplyHistory(client, {
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
            __typename: 'AssetSupplySample',
            date: expect.any(Date),
            amount: expect.any(Object),
            highestApy: expect.any(Object),
            lowestApy: expect.any(Object),
          }),
        );
      });
    });

    describe('When fetching supply history with different time window options', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return supply history for %s time window',
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
