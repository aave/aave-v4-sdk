import { assertOk, PageSize } from '@aave/client';
import { spokePositionManagers } from '@aave/client/actions';
import { client, ETHEREUM_SPOKE_CORE_ID } from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Position Managers on Aave V4', () => {
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
  });
});
