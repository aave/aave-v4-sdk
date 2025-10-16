import {
  ActivityType,
  assertOk,
  evmAddress,
  PageSize,
} from '@aave/client-next';
import { userHistory } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_CORE_ADDRESS,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet(
  '0x8970d4cd97cbd4d0c589d6347be12ac2ae36e008d12b5ec991001b415c3b4b1b',
);

describe('Aave V4 History Scenario', () => {
  describe('Given a user with prior history of transactions', () => {
    beforeAll(async () => {
      // NOTE: Enable when you want to recreate the user history
      // await recreateUserHistory(client, user);
    }, 160_000);

    describe('When fetching the user history by activity type', () => {
      const activityTypes = Object.values(ActivityType);

      it.each(activityTypes)(
        'Then it should be possible to filter them by %s activity',
        async (activityType) => {
          const history = await userHistory(client, {
            user: evmAddress(user.account.address),
            activityTypes: [activityType],
            filter: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });

          assertOk(history);

          history.value.items.forEach((item) => {
            const typenameToActivityType: Record<string, ActivityType> = {
              BorrowActivity: ActivityType.Borrow,
              SupplyActivity: ActivityType.Supply,
              WithdrawActivity: ActivityType.Withdraw,
              RepayActivity: ActivityType.Repay,
              LiquidatedActivity: ActivityType.Liquidated,
              SwapActivity: ActivityType.Swap,
            };

            const itemActivityType = typenameToActivityType[item.__typename];
            expect(itemActivityType).toBe(activityType);
          });
        },
      );
    });

    describe('When fetching multiple activity types', () => {
      it('Then it should return history for all specified activity types', async () => {
        const history = await userHistory(client, {
          user: evmAddress(user.account.address),
          activityTypes: [ActivityType.Supply, ActivityType.Borrow],
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });

        assertOk(history);

        const expectedTypes = ['SupplyActivity', 'BorrowActivity'];
        history.value.items.forEach((item) => {
          expect(expectedTypes).toContain(item.__typename);
        });
      });
    });

    describe('When fetching filtered user history', () => {
      it('Then it should be possible to filter them by chainIds', async () => {
        const history = await userHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });

        assertOk(history);
      });

      it('Then it should be possible to filter them by spoke', async () => {
        const history = await userHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            spoke: {
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });

        assertOk(history);
        assertNonEmptyArray(history.value.items);
      });
    });

    describe('When fetching user history with pagination', () => {
      it('Then it should respect the pageSize parameter', async () => {
        const history = await userHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          pageSize: PageSize.Ten,
        });

        assertOk(history);
        expect(history.value.items.length).toBeLessThanOrEqual(10);
      });

      it('Then it should support pagination with cursor', async () => {
        // First page
        const firstPage = await userHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          pageSize: PageSize.Ten,
        });
        assertOk(firstPage);
        expect(firstPage.value.items.length).toBe(10);
        expect(firstPage.value.pageInfo.next).not.toBeNull();
        const firstPageItemIds = firstPage.value.items.map((item) => item.id);

        const secondPage = await userHistory(client, {
          user: evmAddress(user.account.address),
          filter: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          pageSize: PageSize.Ten,
          cursor: firstPage.value.pageInfo.next,
        });
        assertOk(secondPage);
        expect(secondPage.value.items.length).toBeLessThanOrEqual(10);
        const secondPageItemIds = secondPage.value.items.map((item) => item.id);
        // Elements in second page should not be in first page
        expect(
          secondPageItemIds.some((id) => firstPageItemIds.includes(id)),
        ).toBe(false);
      });
    });
  });
});
