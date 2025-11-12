import { assertOk, Currency, evmAddress, TimeWindow } from '@aave/client-next';
import { userSummary } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { recreateUserActivities } from './helper';

const user = await createNewWallet(
  '0x03f9dd1b3e99ec75cdacdeb397121d50751b87dde022f007406e6faefb14b3dc',
);

describe('Querying User Summary on Aave V4', () => {
  describe('Given a user with multiple active positions', () => {
    beforeAll(async () => {
      // NOTE: Recreate user activities if needed
      await recreateUserActivities(client, user);
    }, 180_000);

    describe('When the user queries their summary without filters', () => {
      it('Then the summary with aggregated financial data is returned', async () => {
        const summary = await userSummary(client, {
          user: evmAddress(user.account.address),
        });
        assertOk(summary);
        expect(summary.value.totalPositions).toBe(1);
      });
    });

    describe('When the user queries their summary filtered by spoke', () => {
      it('Then the summary for that specific spoke is returned', async () => {
        const summary = await userSummary(client, {
          user: evmAddress(user.account.address),
          filter: {
            spoke: {
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(summary);
        expect(summary.value.totalPositions).toBe(1);
      });
    });

    describe('When the user queries their summary filtered by chain IDs', () => {
      it('Then the summary for those specific chains is returned', async () => {
        const summary = await userSummary(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(summary);
        expect(summary.value.totalPositions).toBe(1);
      });
    });

    describe('When the user queries their summary with different currency options', () => {
      it('Then the summary values are returned in the specified currency', async () => {
        const summaryEUR = await userSummary(
          client,
          {
            user: evmAddress(user.account.address),
          },
          { currency: Currency.Eur },
        );
        assertOk(summaryEUR);
        expect(summaryEUR.value.netBalance.current.name).toBe('EUR');
        expect(summaryEUR.value.totalCollateral.name).toBe('EUR');
        expect(summaryEUR.value.totalSupplied.name).toBe('EUR');
        expect(summaryEUR.value.totalDebt.name).toBe('EUR');

        const summaryGBP = await userSummary(
          client,
          {
            user: evmAddress(user.account.address),
          },
          { currency: Currency.Gbp },
        );
        assertOk(summaryGBP);
        expect(summaryGBP.value.netBalance.current.name).toBe('GBP');
        expect(summaryGBP.value.totalCollateral.name).toBe('GBP');
        expect(summaryGBP.value.totalSupplied.name).toBe('GBP');
        expect(summaryGBP.value.totalDebt.name).toBe('GBP');
      });
    });

    describe('When the user queries their summary with different time windows', () => {
      const timeWindowOptions = Object.values(TimeWindow);
      it.each(timeWindowOptions)(
        'Then the summary is returned for the %s time window',
        async (timeWindow) => {
          const summary = await userSummary(
            client,
            {
              user: evmAddress(user.account.address),
            },
            { timeWindow: timeWindow },
          );
          assertOk(summary);
          // Note: think about how to make sure the summary is returned for the correct time window
        },
      );
    });
  });
});
