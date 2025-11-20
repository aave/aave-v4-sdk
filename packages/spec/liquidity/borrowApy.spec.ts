import { assertOk, TimeWindow } from '@aave/client';
import { borrowApyHistory, reserves } from '@aave/client/actions';
import {
  client,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/test-utils';
import { describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../helpers/tools';
import { assertNonEmptyArray } from '../test-utils';

describe('Borrow APY History on Aave V4', () => {
  describe('Given a reserve with borrow activity', () => {
    describe('When fetching borrow APY history with different time windows', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return borrow APY history for %s time window',
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

          const result = await borrowApyHistory(client, {
            reserve: usdcReserve.value[0].id,
            window: window,
          });
          assertOk(result);
          const { now, startDate } = getTimeWindowDates(window);
          result.value.forEach((item) => {
            expect(item.date.toISOString()).toBeBetweenDates(startDate, now);
          });
        },
      );
    });
  });
});
