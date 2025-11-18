import { assertOk, Currency, evmAddress, TimeWindow } from '@aave/client';
import { userPositions, userSummary } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
} from '@aave/client/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertNonEmptyArray } from '../test-utils';
import { recreateUserPositions } from './helper';

const user = await createNewWallet(
  '0x3bbb745c15f3b0daf1be54fb7b8281cc8eaac0249a28a4442052ebb0061e660d',
);

describe('Querying User Summary on Aave V4', () => {
  describe('Given a user with multiple active positions', () => {
    beforeAll(async () => {
      // NOTE: Recreate user positions if needed
      await recreateUserPositions(client, user);
    }, 180_000);

    describe('When the user queries their summary without filters', () => {
      it('Then the summary with aggregated financial data is returned', async () => {
        const summary = await userSummary(client, {
          user: evmAddress(user.account.address),
        });
        assertOk(summary);
        expect(summary.value.totalPositions).toBe(2);
      });
    });

    describe('When the user queries their summary filtered by spoke', () => {
      it('Then the summary for that specific spoke is returned', async () => {
        let summary = await userSummary(client, {
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

        summary = await userSummary(client, {
          user: evmAddress(user.account.address),
          filter: {
            spokeId: ETHEREUM_SPOKE_CORE_ID,
          },
        });
        assertOk(summary);
        expect(summary.value.totalPositions).toBe(1);
      });
    });

    describe('When the user queries their summary filtered by user position ID', () => {
      it('Then the summary for that specific user position is returned', async () => {
        const positions = await userPositions(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);

        const summary = await userSummary(client, {
          user: evmAddress(user.account.address),
          filter: {
            userPositionId: positions.value[0].id,
          },
        });
        assertOk(summary);
        expect(summary.value.totalPositions).toBe(1);
        expect(
          summary.value.totalCollateral.value.round(0),
        ).toBeBigDecimalCloseTo(
          positions.value[0].totalCollateral.current.value.round(0),
        );
        expect(
          summary.value.totalSupplied.value.round(0),
        ).toBeBigDecimalCloseTo(
          positions.value[0].totalSupplied.current.value.round(0),
        );
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
        expect(summary.value.totalPositions).toBe(2);
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
        },
      );
    });
  });
});
