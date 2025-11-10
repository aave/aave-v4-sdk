import { assertOk, PageSize } from '@aave/client-next';
import { spokePositionManagers } from '@aave/client-next/actions';
import { client, ETHEREUM_SPOKE_CORE_ID } from '@aave/client-next/test-utils';
import { describe, expect, it } from 'vitest';

describe('Available Position Managers in a Spoke on Aave V4', () => {
  describe('Given a user who wants to fetch position managers for a specific spoke', () => {
    describe('When fetching position managers with default settings', () => {
      it('Then it should return active position managers', async () => {
        const result = await spokePositionManagers(client, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          pageSize: PageSize.Ten,
        });

        assertOk(result);
        expect(result.value.items).toMatchSnapshot();
      });
    });

    describe('When fetching position managers including inactive ones', () => {
      it('Then it should return both active and inactive position managers', async () => {
        const resultWithInactive = await spokePositionManagers(client, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          pageSize: PageSize.Ten,
          includeInactive: true,
        });

        assertOk(resultWithInactive);
        // TODO: add assertions when we have some position manager in stage with inactive status
      });
    });

    // TODO: not enough positions managers to perform pagination
    describe.skip('When fetching position managers with pagination', () => {
      it('Then it should support pagination with cursor when there are more results', async () => {
        // First page
        const firstPage = await spokePositionManagers(client, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          pageSize: PageSize.Ten,
        });

        assertOk(firstPage);
        expect(firstPage.value.items.length).toEqual(10);

        const secondPage = await spokePositionManagers(client, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          pageSize: PageSize.Ten,
          cursor: firstPage.value.pageInfo.next,
        });

        assertOk(secondPage);
        expect(secondPage.value.items.length).toBeGreaterThan(0);

        expect(firstPage.value.items[0]!.address).not.toBe(
          secondPage.value.items[0]!.address,
        );
      });
    });
  });
});
