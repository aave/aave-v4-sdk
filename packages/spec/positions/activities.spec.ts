import {
  type ActivityItem,
  ActivityType,
  assertOk,
  evmAddress,
  PageSize,
} from '@aave/client';
import { activities } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ID,
  ETHEREUM_SPOKE_CORE_ID,
} from '@aave/client/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { recreateUserActivities } from './helper';

const user = await createNewWallet(
  '0x03f9dd1b3e99ec75cdacdeb397121d50751b87dde022f007406e6faefb14b3dc',
);

describe('Querying User Activities on Aave V4', () => {
  const activityTypes = Object.values(ActivityType);

  const typenameToActivityType: Record<
    ActivityType,
    ActivityItem['__typename']
  > = {
    [ActivityType.Borrow]: 'BorrowActivity',
    [ActivityType.Supply]: 'SupplyActivity',
    [ActivityType.Withdraw]: 'WithdrawActivity',
    [ActivityType.Repay]: 'RepayActivity',
    [ActivityType.Liquidated]: 'LiquidatedActivity',
    [ActivityType.SetAsCollateral]: 'UsingAsCollateralActivity',
  };
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

          if ([ActivityType.Liquidated].includes(activityType)) {
            // Liquidated activities are not easily reproducible, so we skip them
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
            query: {
              spokeId: ETHEREUM_SPOKE_CORE_ID,
            },
          });
          assertOk(result);

          expect(result.value.items).toBeArrayWithElements(
            expect.objectContaining({
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
          if ([ActivityType.Liquidated].includes(activityType)) {
            // Liquidated activities are not easily reproducible, so we skip them
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
        expect(result.value.items).toBeArrayWithElements(
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
