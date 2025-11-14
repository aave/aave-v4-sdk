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
  ETHEREUM_HUB_CORE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ADDRESS,
} from '@aave/client-next/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { assertNonEmptyArray } from '../test-utils';
import { recreateUserActivities } from './helper';

const user = await createNewWallet(
  '0x03f9dd1b3e99ec75cdacdeb397121d50751b87dde022f007406e6faefb14b3dc',
);

describe('Query User Activities on Aave V4', () => {
  describe('Given a user with prior history of activities', () => {
    beforeAll(async () => {
      // NOTE: Recreate user activities if needed
      await recreateUserActivities(client, user);
    }, 180_000);

    describe('When fetching the user activities by an activity type', () => {
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
        'Then the returned activities are only of type %s',
        async (activityType) => {
          const result = await activities(client, {
            user: evmAddress(user.account.address),
            types: [activityType],
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });

          assertOk(result);
          if ([ActivityType.Liquidated].includes(activityType)) {
            // Liquidated activities are not easily reproducible, so we skip them
            return;
          }
          assertNonEmptyArray(result.value.items);
          result.value.items.forEach((activity) => {
            expect(activity.user).toEqual(evmAddress(user.account.address));
          });
          const listActivityTypes = result.value.items.map(
            (item) => typenameToActivityType[item.__typename],
          );
          expect(listActivityTypes).toSatisfyAll(
            (activity) => activity === activityType,
          );
        },
      );
    });

    describe('When fetching the user activities by activities type filter and chainIds', () => {
      it('Then the returned activities should be filtered by the specified activities types', async () => {
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
          expect(item.user).toEqual(evmAddress(user.account.address));
          expect(item.spoke.chain.chainId).toEqual(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When fetching the user activities by a chainId', () => {
      it('Then the returned activities are only from the specified chain', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });

        assertOk(result);
        assertNonEmptyArray(result.value.items);
        result.value.items.forEach((item) => {
          expect(item.user).toEqual(evmAddress(user.account.address));
          expect(item.spoke.chain.chainId).toEqual(ETHEREUM_FORK_ID);
        });
      });

      describe('When fetching the user activities by spoke', () => {
        it('Then the returned activities are only from the specified spoke', async () => {
          const result = await activities(client, {
            user: evmAddress(user.account.address),
            query: {
              spoke: {
                address: ETHEREUM_SPOKE_CORE_ADDRESS,
                chainId: ETHEREUM_FORK_ID,
              },
            },
          });

          assertOk(result);
          assertNonEmptyArray(result.value.items);
          result.value.items.forEach((item) => {
            expect(item.user).toEqual(evmAddress(user.account.address));
            expect(item.spoke.address).toEqual(ETHEREUM_SPOKE_CORE_ADDRESS);
            expect(item.spoke.chain.chainId).toEqual(ETHEREUM_FORK_ID);
          });
        });
      });
    });

    describe('When fetching the user activities by hub', () => {
      it('Then the returned activities are only from the specified hub', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            hub: {
              address: ETHEREUM_HUB_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(result);
        assertNonEmptyArray(result.value.items);
        result.value.items.forEach((item) => {
          expect(item.user).toEqual(evmAddress(user.account.address));
          if (item.__typename !== 'LiquidatedActivity') {
            expect(item.reserve.asset.hub.address).toEqual(
              ETHEREUM_HUB_CORE_ADDRESS,
            );
          }
        });
      });
    });

    describe('When fetching all the user activities with a page size 10', () => {
      it('Then the returned activities should be limited to 10', async () => {
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

      it('Then if there are more activities, the next page should be available', async () => {
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
        // Elements in the second page should not be in the first page
        expect(
          secondPageItemIds.some((id) => firstPageItemIds.includes(id)),
        ).toBe(false);
      });
    });
  });

  describe('Given a user want to know all activities without providing a user address', () => {
    describe('When fetching all activities by a chainId', () => {
      it('Then the returned activities are only from the specified chain', async () => {
        const result = await activities(client, {
          query: {
            chainIds: [ETHEREUM_FORK_ID],
          },
        });
        assertOk(result);
        assertNonEmptyArray(result.value.items);
        // Default page size is 50
        expect(result.value.items.length).toEqual(50);
        result.value.items.forEach((item) => {
          expect(item.spoke.chain.chainId).toEqual(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When fetching all activities by an activity type', () => {
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
        'Then the returned activities are only of type %s',
        async (activityType) => {
          const result = await activities(client, {
            types: [activityType],
            query: {
              chainIds: [ETHEREUM_FORK_ID],
            },
          });

          assertOk(result);
          if (
            [ActivityType.Liquidated, ActivityType.SetAsCollateral].includes(
              activityType,
            )
          ) {
            // Liquidated activities are not easily reproducible, so we skip them
            // TODO: Enable when fixed AAVE-2555 setAsCollateral activities
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

    describe('When fetching all activities by multiple activity types', () => {
      it('Then the returned activities are only of the specified activity types', async () => {
        const result = await activities(client, {
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

    describe('When fetching all activities by a spoke', () => {
      it('Then the returned activities are only from the specified spoke', async () => {
        const result = await activities(client, {
          query: {
            spoke: {
              address: ETHEREUM_SPOKE_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(result);
        assertNonEmptyArray(result.value.items);
        result.value.items.forEach((item) => {
          expect(item.spoke.address).toEqual(ETHEREUM_SPOKE_CORE_ADDRESS);
          expect(item.spoke.chain.chainId).toEqual(ETHEREUM_FORK_ID);
        });
      });
    });

    describe('When fetching all activities by a hub', () => {
      it('Then the returned activities are only from the specified hub', async () => {
        const result = await activities(client, {
          query: {
            hub: {
              address: ETHEREUM_HUB_CORE_ADDRESS,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        });
        assertOk(result);
        assertNonEmptyArray(result.value.items);
        result.value.items.forEach((item) => {
          if (item.__typename !== 'LiquidatedActivity') {
            expect(item.reserve.asset.hub.address).toEqual(
              ETHEREUM_HUB_CORE_ADDRESS,
            );
          }
        });
      });
    });
  });
});
