import { assertOk, Currency, evmAddress, TimeWindow } from '@aave/client';
import { userPositions, userSummaryHistory } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
} from '@aave/client/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { getTimeWindowDates } from '../helpers/tools';
import { assertNonEmptyArray } from '../test-utils';
import { recreateUserPositions } from './helper';

const user = await createNewWallet(
  '0x3bbb745c15f3b0daf1be54fb7b8281cc8eaac0249a28a4442052ebb0061e660d',
);

describe('Querying User Summary History on Aave V4', () => {
  describe('Given a user with multiple active positions', () => {
    beforeAll(async () => {
      // NOTE: Recreate user positions if needed
      await recreateUserPositions(client, user);
    }, 180_000);

    describe('When the user queries their summary history without filters', () => {
      it('Then the summary history data is returned', async () => {
        const summary = await userSummaryHistory(client, {
          user: evmAddress(user.account.address),
        });
        assertOk(summary);

        expect(summary.value).toIncludeAllMembers([
          {
            __typename: 'UserSummaryHistoryItem',
            healthFactor: expect.any(Object),
            date: expect.any(Date),
            netBalance: expect.any(Object),
            borrows: expect.any(Object),
            supplies: expect.any(Object),
          },
        ]);
        const listDate = summary.value.map((item) => item.date);
        expect(listDate).toBeSortedByDate('asc');
      });
    });

    describe('When the user queries their summary history filtered by spoke', () => {
      it('Then the summary history for that specific spoke is returned', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);
        const testSpoke = positions.value[0]!.spoke;

        let summary = await userSummaryHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            spoke: {
              address: testSpoke.address,
              chainId: testSpoke.chain.chainId,
            },
          },
        });
        assertOk(summary);

        expect(summary.value).toIncludeAllMembers([
          {
            __typename: 'UserSummaryHistoryItem',
            healthFactor: expect.any(Object),
            date: expect.any(Date),
            netBalance: expect.any(Object),
            borrows: expect.any(Object),
            supplies: expect.any(Object),
          },
        ]);
        let listDate = summary.value.map((item) => item.date);
        expect(listDate).toBeSortedByDate('asc');

        summary = await userSummaryHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            spokeId: testSpoke.id,
          },
        });
        assertOk(summary);

        expect(summary.value).toIncludeAllMembers([
          {
            __typename: 'UserSummaryHistoryItem',
            healthFactor: expect.any(Object),
            date: expect.any(Date),
            netBalance: expect.any(Object),
            borrows: expect.any(Object),
            supplies: expect.any(Object),
          },
        ]);
        listDate = summary.value.map((item) => item.date);
        expect(listDate).toBeSortedByDate('asc');
      });
    });

    describe('When the user queries their summary history filtered by user position ID', () => {
      it('Then the summary history for that specific user position is returned', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);

        const summary = await userSummaryHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            userPositionId: positions.value[0].id,
          },
        });
        assertOk(summary);

        expect(summary.value).toIncludeAllMembers([
          {
            __typename: 'UserSummaryHistoryItem',
            healthFactor: expect.any(Object),
            date: expect.any(Date),
            netBalance: expect.any(Object),
            borrows: expect.any(Object),
            supplies: expect.any(Object),
          },
        ]);
        const listDate = summary.value.map((item) => item.date);
        expect(listDate).toBeSortedByDate('asc');
      });
    });

    describe('When the user queries their summary history filtered by chain IDs', () => {
      it('Then the summary history for those specific chains is returned', async () => {
        const summary = await userSummaryHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(summary);

        expect(summary.value).toIncludeAllMembers([
          {
            __typename: 'UserSummaryHistoryItem',
            healthFactor: expect.any(Object),
            date: expect.any(Date),
            netBalance: expect.any(Object),
            borrows: expect.any(Object),
            supplies: expect.any(Object),
          },
        ]);
        const listDate = summary.value.map((item) => item.date);
        expect(listDate).toBeSortedByDate('asc');
      });
    });

    describe('When the user queries their summary history with different currency options', () => {
      it('Then the summary history is returned in the specified currency', async () => {
        const summaryEUR = await userSummaryHistory(
          client,
          {
            user: evmAddress(user.account.address),
          },
          { currency: Currency.Eur },
        );
        assertOk(summaryEUR);

        summaryEUR.value.forEach((item) => {
          expect(item.borrows.name).toBe('EUR');
          expect(item.supplies.name).toBe('EUR');
          expect(item.netBalance.name).toBe('EUR');
        });

        const summaryGBP = await userSummaryHistory(
          client,
          {
            user: evmAddress(user.account.address),
          },
          { currency: Currency.Gbp },
        );
        assertOk(summaryGBP);

        summaryGBP.value.forEach((item) => {
          expect(item.borrows.name).toBe('GBP');
          expect(item.supplies.name).toBe('GBP');
          expect(item.netBalance.name).toBe('GBP');
        });
      });
    });

    describe('When the user queries their summary history with different time windows', () => {
      const timeWindowOptions = Object.values(TimeWindow);
      it.each(timeWindowOptions)(
        'Then the summary history is returned for the %s time window',
        async (timeWindow) => {
          const { now, startDate } = getTimeWindowDates(timeWindow);
          const summary = await userSummaryHistory(client, {
            user: evmAddress(user.account.address),
            window: timeWindow,
          });
          assertOk(summary);

          expect(summary.value).toIncludeAllMembers([
            {
              __typename: 'UserSummaryHistoryItem',
              healthFactor: expect.any(Object),
              date: expect.toBeBetweenDates(startDate, now),
              netBalance: expect.any(Object),
              borrows: expect.any(Object),
              supplies: expect.any(Object),
            },
          ]);
        },
      );
    });
  });
});
