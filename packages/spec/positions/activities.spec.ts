import {
  type ActivityItem,
  ActivityType,
  assertOk,
  evmAddress,
  PageSize,
} from '@aave/client-next';
import { activities } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet(
  '0x95914dd71f13f28b7f4bac9b2fb3741a53eb784cdab666acb9f40ebe6ec479aa',
);

describe('Query User Activities on Aave V4', () => {
  describe('Given a user with prior history of activities', () => {
    beforeAll(async () => {
      // NOTE: Enable when you want to recreate the user activities
      // await recreateUserActivities(client, user);
    }, 160_000);

    describe('When fetching the user activities by activity type filter', () => {
      const activityTypes = Object.values(ActivityType);

      const typenameToActivityType: Record<
        ActivityItem['__typename'],
        ActivityType
      > = {
        BorrowActivity: ActivityType.Borrow,
        SupplyActivity: ActivityType.Supply,
        WithdrawActivity: ActivityType.Withdraw,
        RepayActivity: ActivityType.Repay,
        LiquidatedActivity: ActivityType.Liquidated,
        UsingAsCollateralActivity: ActivityType.SetAsCollateral,
      };

      it.each(activityTypes)(
        'Then it should be possible to filter them by %s activity',
        async (activityType) => {
          const result = await activities(client, {
            user: evmAddress(user.account.address),
            types: [activityType],
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });

          assertOk(result);
          if (
            [ActivityType.Liquidated, ActivityType.Repay].includes(activityType)
          ) {
            // TODO: refactor recreateUserActivities to create repay
            return;
          }
          assertNonEmptyArray(result.value.items);
          const listActivityTypes = result.value.items.map(
            (item) => typenameToActivityType[item.__typename],
          );
          expect(listActivityTypes).toSatisfyAll(
            (activity) => activity === activityType,
          );
        },
      );
    });

    describe('When fetching multiple activity types', () => {
      it('Then it should return history for all specified activity types', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          types: [ActivityType.Supply, ActivityType.Borrow],
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });

        assertOk(result);

        const expectedTypes = ['SupplyActivity', 'BorrowActivity'];
        result.value.items.forEach((item) => {
          expect(expectedTypes).toContain(item.__typename);
        });
      });
    });

    describe('When fetching filtered user history', () => {
      it('Then it should be possible to filter them by chainIds', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });

        assertOk(result);
      });

      it('Then it should be possible to filter them by spoke', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            spoke: {
              address: ETHEREUM_SPOKE_ISO_STABLE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });

        assertOk(result);
        assertNonEmptyArray(result.value.items);
      });
    });

    describe('When fetching user history with pagination', () => {
      it('Then it should respect the pageSize parameter', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          pageSize: PageSize.Ten,
        });

        assertOk(result);
        expect(result.value.items.length).toBeLessThanOrEqual(10);
      });

      it('Then it should support pagination with cursor', async () => {
        // First page
        const firstPage = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
          pageSize: PageSize.Ten,
        });
        assertOk(firstPage);
        expect(firstPage.value.items.length).toBe(10);
        expect(firstPage.value.pageInfo.next).not.toBeNull();
        const firstPageItemIds = firstPage.value.items.map((item) => item.id);

        const secondPage = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
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
