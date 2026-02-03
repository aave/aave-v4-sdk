import { assertOk, Currency, TimeWindow } from '@aave/client';
import { protocolHistory } from '@aave/client/actions';
import { client } from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

import { getTimeWindowDates } from '../helpers/tools';

describe('Querying Protocol History on Aave V4', () => {
  describe('Given a user who wants to query protocol-wide historical data', () => {
    describe('When fetching protocol history with a specific time window', () => {
      const timeWindowOptions = Object.values(TimeWindow);

      it.each(timeWindowOptions)(
        'Then it should return the protocol history data for the %s time window',
        async (window) => {
          const result = await protocolHistory(client, {
            window: window,
          });
          assertOk(result);

          const { now, startDate } = getTimeWindowDates(window);
          expect(result.value).toBeArrayWithElements(
            expect.objectContaining({
              __typename: 'ProtocolHistorySample',
              date: expect.toBeBetweenDates(startDate, now),
              deposits: expect.any(Object),
              borrows: expect.any(Object),
            }),
          );
        },
      );
    });

    describe('When fetching protocol history with different currency options', () => {
      it('Then the protocol history is returned in the specified currency', async () => {
        const resultUSD = await protocolHistory(client, {
          currency: Currency.Usd,
        });
        assertOk(resultUSD);

        expect(resultUSD.value).toBeArrayWithElements(
          expect.objectContaining({
            deposits: expect.objectContaining({ name: 'USD' }),
            borrows: expect.objectContaining({ name: 'USD' }),
          }),
        );

        const resultEUR = await protocolHistory(client, {
          currency: Currency.Eur,
        });
        assertOk(resultEUR);

        expect(resultEUR.value).toBeArrayWithElements(
          expect.objectContaining({
            deposits: expect.objectContaining({ name: 'EUR' }),
            borrows: expect.objectContaining({ name: 'EUR' }),
          }),
        );

        const resultGBP = await protocolHistory(client, {
          currency: Currency.Gbp,
        });
        assertOk(resultGBP);

        expect(resultGBP.value).toBeArrayWithElements(
          expect.objectContaining({
            deposits: expect.objectContaining({ name: 'GBP' }),
            borrows: expect.objectContaining({ name: 'GBP' }),
          }),
        );
      });
    });
  });
});
