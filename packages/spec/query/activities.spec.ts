import {
  type ActivityItem,
  ActivityType,
  assertOk,
  evmAddress,
  type OpaqueTypename,
  PageSize,
} from '@aave/client';
import { activities } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ID,
  ETHEREUM_SPOKE_CORE_ID,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';

import { recreateUserActivities } from './helpers';

const user = await createNewWallet(
  '0x03f9dd1b3e99ec75cdacdeb397121d50751b87dde022f007406e6faefb14b3dc',
);

function isSwapActivity(activity: ActivityItem): boolean {
  return (
    activity.__typename === 'SupplySwapActivity' ||
    activity.__typename === 'BorrowSwapActivity' ||
    activity.__typename === 'RepayWithSupplyActivity' ||
    activity.__typename === 'WithdrawSwapActivity' ||
    activity.__typename === 'TokenSwapActivity'
  );
}

describe('Querying User Activities on Aave V4', () => {
  const activityTypes = Object.values(ActivityType);

  const typenameToActivityType: Record<
    ActivityType,
    Exclude<ActivityItem['__typename'], OpaqueTypename>
  > = {
    [ActivityType.Borrow]: 'BorrowActivity',
    [ActivityType.Supply]: 'SupplyActivity',
    [ActivityType.Withdraw]: 'WithdrawActivity',
    [ActivityType.Repay]: 'RepayActivity',
    [ActivityType.Liquidated]: 'LiquidatedActivity',
    [ActivityType.SetAsCollateral]: 'UsingAsCollateralActivity',
    [ActivityType.UpdatedDynamicConfig]: 'UpdatedDynamicConfigActivity',
    [ActivityType.UpdatedRiskPremium]: 'UpdatedRiskPremiumActivity',
    [ActivityType.TokenToTokenSwap]: 'TokenSwapActivity',
    [ActivityType.SupplySwap]: 'SupplySwapActivity',
    [ActivityType.BorrowSwap]: 'BorrowSwapActivity',
    [ActivityType.RepayWithSupply]: 'RepayWithSupplyActivity',
    [ActivityType.WithdrawSwap]: 'WithdrawSwapActivity',
  };

  // Liquidated activities are not easily reproducible, so we skip them
  // New activity types are not yet supported in tests
  const skipActivityTypes = [
    ActivityType.Liquidated,
    ActivityType.UpdatedDynamicConfig,
    ActivityType.UpdatedRiskPremium,
    ActivityType.TokenToTokenSwap,
    ActivityType.SupplySwap,
    ActivityType.BorrowSwap,
    ActivityType.RepayWithSupply,
    ActivityType.WithdrawSwap,
  ];

  describe('Given a user with prior history of activities', () => {
    beforeAll(async () => {
      // NOTE: Recreate user activities if needed
      await recreateUserActivities(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
      });
    }, 180_000);

    describe('When fetching the user activities by an activity type', () => {
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

          if (skipActivityTypes.includes(activityType)) {
            return;
          }

          expect(result.value.items).toBeArrayWithElements(
            expect.objectContaining({
              __typename: expect.toEqualCaseInsensitive(
                typenameToActivityType[activityType],
              ),
              id: expect.any(String),
              timestamp: expect.any(Date),
              txHash: expect.any(String),
              user: expect.toEqualCaseInsensitive(
                evmAddress(user.account.address),
              ),
            }),
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
        expect(result.value.items).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(expectedTypes),
            user: expect.toEqualCaseInsensitive(
              evmAddress(user.account.address),
            ),
          }),
        );
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

        expect(result.value.items).toBeArrayWithElements(
          expect.objectContaining({
            user: expect.toEqualCaseInsensitive(
              evmAddress(user.account.address),
            ),
            chain: expect.objectContaining({
              chainId: ETHEREUM_FORK_ID,
            }),
          }),
        );
      });

      describe('When fetching the user activities by spoke', () => {
        it('Then the returned activities are only from the specified spoke', async () => {
          const result = await activities(client, {
            user: evmAddress(user.account.address),
            query: {
              spokeId: ETHEREUM_SPOKE_CORE_ID,
            },
          });
          assertOk(result);

          // Filter out swap activities (they don't have a direct spoke field)
          const nonSwapActivities = result.value.items.filter(
            (item) => !isSwapActivity(item),
          );

          // Check that all non-swap activities have the correct spokeId
          expect(nonSwapActivities).toBeArrayWithElements(
            expect.objectContaining({
              user: expect.toEqualCaseInsensitive(
                evmAddress(user.account.address),
              ),
              spoke: expect.objectContaining({
                id: ETHEREUM_SPOKE_CORE_ID,
              }),
            }),
          );
        });
      });
    });

    describe('When fetching the user activities by hub', () => {
      it('Then the returned activities are only from the specified hub', async () => {
        const result = await activities(client, {
          user: evmAddress(user.account.address),
          query: {
            hubId: ETHEREUM_HUB_CORE_ID,
          },
        });
        assertOk(result);

        expect(result.value.items).toBeArrayWithElements(
          expect.objectContaining({
            user: expect.toEqualCaseInsensitive(
              evmAddress(user.account.address),
            ),
            reserve: expect.objectContaining({
              asset: expect.objectContaining({
                hub: expect.objectContaining({
                  id: ETHEREUM_HUB_CORE_ID,
                }),
              }),
            }),
          }),
        );
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
        const getActivityId = (item: ActivityItem) => item.id;
        const firstPageItemIds = firstPage.value.items.map(getActivityId);

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
        const secondPageItemIds = secondPage.value.items.map(getActivityId);
        // The last element of the first page should be the same as the first element of the second page
        const lastFirstPageId = firstPageItemIds[firstPageItemIds.length - 1];
        const firstSecondPageId = secondPageItemIds[0];
        expect(lastFirstPageId).toBe(firstSecondPageId);
        // All other IDs should be unique (no overlap except for the boundary element)
        const firstPageIdsWithoutLast = firstPageItemIds.slice(0, -1);
        const secondPageIdsWithoutFirst = secondPageItemIds.slice(1);
        expect(
          secondPageIdsWithoutFirst.some((id) =>
            firstPageIdsWithoutLast.includes(id),
          ),
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
        // Default page size is 50
        expect(result.value.items.length).toEqual(50);
        expect(result.value.items).toBeArrayWithElements(
          expect.objectContaining({
            chain: expect.objectContaining({
              chainId: ETHEREUM_FORK_ID,
            }),
          }),
        );
      });
    });

    describe('When fetching all activities by an activity type', () => {
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

          if (skipActivityTypes.includes(activityType)) {
            return;
          }

          expect(result.value.items).toBeArrayWithElements(
            expect.objectContaining({
              __typename: expect.toEqualCaseInsensitive(
                typenameToActivityType[activityType],
              ),
            }),
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
        expect(result.value.items).toBeArrayWithElements(
          expect.objectContaining({
            __typename: expect.toBeOneOf(expectedTypes),
          }),
        );
      });
    });

    describe('When fetching all activities by a spoke', () => {
      it('Then the returned activities are only from the specified spoke', async () => {
        const result = await activities(client, {
          query: {
            spokeId: ETHEREUM_SPOKE_CORE_ID,
          },
        });
        assertOk(result);

        // Filter out swap activities (they don't have a direct spoke field)
        const nonSwapActivities = result.value.items.filter(
          (item) => !isSwapActivity(item),
        );

        // Check that all non-swap activities have the correct spokeId
        expect(nonSwapActivities).toBeArrayWithElements(
          expect.objectContaining({
            spoke: expect.objectContaining({
              id: ETHEREUM_SPOKE_CORE_ID,
            }),
          }),
        );
      });
    });

    describe('When fetching all activities by a hub', () => {
      it('Then the returned activities are only from the specified hub', async () => {
        const result = await activities(client, {
          query: {
            hubId: ETHEREUM_HUB_CORE_ID,
          },
        });
        assertOk(result);
        expect(result.value.items).toBeArrayWithElements(
          expect.objectContaining({
            reserve: expect.objectContaining({
              asset: expect.objectContaining({
                hub: expect.objectContaining({
                  id: ETHEREUM_HUB_CORE_ID,
                }),
              }),
            }),
          }),
        );
      });
    });
  });
});
