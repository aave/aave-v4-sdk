import { assertOk, TimeWindow } from '@aave/client';
import { assetBorrowHistory } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../../helpers/tools';

describe('Querying Asset Apy Borrow History on Aave V4', () => {
  describe('Given an asset/token available on the protocol', () => {
    describe('When fetching the asset apy borrow history with a specific time window', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return the asset apy borrow history for the %s time window',
        async (window) => {
          const result = await assetBorrowHistory(client, {
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
              __typename: 'AssetBorrowSample',
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
