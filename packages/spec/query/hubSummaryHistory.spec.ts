import { assertOk, Currency, type HubId, TimeWindow } from '@aave/client';
import { hubSummaryHistory, hubs } from '@aave/client/actions';
import { client, ETHEREUM_FORK_ID } from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';

import { getTimeWindowDates } from '../helpers/tools';
import { assertNonEmptyArray } from '../test-utils';

describe('Querying Hub Summary History on Aave V4', () => {
  describe('Given a hub available on the protocol', () => {
    let hubId: HubId;

    beforeAll(async () => {
      const listHubs = await hubs(client, {
        query: { chainIds: [ETHEREUM_FORK_ID] },
      });
      assertOk(listHubs);
      assertNonEmptyArray(listHubs.value);
      hubId = listHubs.value[0].id;
    });

    describe('When fetching hub summary history with a specific time window', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return the hub summary history for the %s time window',
        async (window) => {
          const result = await hubSummaryHistory(client, {
            query: { hubId },
            window: window,
          });
          assertOk(result);

          const { now, startDate } = getTimeWindowDates(window);
          expect(result.value).toBeArrayWithElements(
            expect.objectContaining({
              __typename: 'HubSummarySample',
              date: expect.toBeBetweenDates(startDate, now),
              deposits: expect.any(Object),
              borrows: expect.any(Object),
              availableLiquidity: expect.any(Object),
              utilizationRate: expect.any(Object),
            }),
          );
        },
      );
    });

    describe('When fetching hub summary history with different currency options', () => {
      it('Then the hub summary history is returned in the specified currency', async () => {
        const resultUSD = await hubSummaryHistory(client, {
          query: { hubId },
          currency: Currency.Usd,
        });
        assertOk(resultUSD);

        expect(resultUSD.value).toBeArrayWithElements(
          expect.objectContaining({
            deposits: expect.objectContaining({ name: 'USD' }),
            borrows: expect.objectContaining({ name: 'USD' }),
            availableLiquidity: expect.objectContaining({ name: 'USD' }),
          }),
        );

        const resultEUR = await hubSummaryHistory(client, {
          query: { hubId },
          currency: Currency.Eur,
        });
        assertOk(resultEUR);

        expect(resultEUR.value).toBeArrayWithElements(
          expect.objectContaining({
            deposits: expect.objectContaining({ name: 'EUR' }),
            borrows: expect.objectContaining({ name: 'EUR' }),
            availableLiquidity: expect.objectContaining({ name: 'EUR' }),
          }),
        );

        const resultGBP = await hubSummaryHistory(client, {
          query: { hubId },
          currency: Currency.Gbp,
        });
        assertOk(resultGBP);

        expect(resultGBP.value).toBeArrayWithElements(
          expect.objectContaining({
            deposits: expect.objectContaining({ name: 'GBP' }),
            borrows: expect.objectContaining({ name: 'GBP' }),
            availableLiquidity: expect.objectContaining({ name: 'GBP' }),
          }),
        );
      });
    });
  });
});
