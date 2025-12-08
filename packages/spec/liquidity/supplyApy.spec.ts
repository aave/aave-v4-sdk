import { assertOk, TimeWindow } from '@aave/client';
import { reserves, supplyApyHistory } from '@aave/client/actions';
import {
  client,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../helpers/tools';
import { assertNonEmptyArray } from '../test-utils';

describe('Querying Supply APY History on Aave V4', () => {
  describe('Given a reserve with supply activity', () => {
    describe('When fetching supply APY history with different time windows', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return supply APY history for %s time window',
        async (window) => {
          // Get a reserve to test with
          const usdcReserve = await reserves(client, {
            query: {
              spokeToken: {
                token: ETHEREUM_USDC_ADDRESS,
                spoke: ETHEREUM_SPOKE_CORE_ID,
              },
            },
          });
          assertOk(usdcReserve);
          assertNonEmptyArray(usdcReserve.value);

          const result = await supplyApyHistory(client, {
            reserve: usdcReserve.value[0].id,
            window: window,
          });
          assertOk(result);
          const { now, startDate } = getTimeWindowDates(window);
          expect(result.value).toBeArrayWithElements(
            expect.objectContaining({
              __typename: 'APYSample',
              date: expect.toBeBetweenDates(startDate, now),
              avgRate: expect.any(Object),
            }),
          );
        },
      );
    });
  });
});
