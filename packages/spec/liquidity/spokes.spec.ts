import { assertOk } from '@aave/client';
import { spokes } from '@aave/client/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUB_CORE_ID,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

describe('Querying Spokes on Aave V4', () => {
  describe('Given a user who wants to fetch spokes by chain ID', () => {
    it('Then it should return the spokes', async () => {
      const spokesResult = await spokes(client, {
        query: {
          chainIds: [ETHEREUM_FORK_ID],
        },
      });
      assertOk(spokesResult);
      expect(spokesResult.value).toMatchSnapshot();
    });
  });

  describe('Given a user who wants to fetch spokes by hub', () => {
    it('Then it should return the spokes for the specified hub', async () => {
      const spokesResult = await spokes(client, {
        query: {
          hubId: ETHEREUM_HUB_CORE_ID,
        },
      });
      assertOk(spokesResult);
      expect(spokesResult.value).toMatchSnapshot();
    });
  });
});
