import { assertOk, chainId } from '@aave/client-next';
import { spokes } from '@aave/client-next/actions';
import {
  client,
  ETHEREUM_FORK_ID,
  ETHEREUM_HUBS,
} from '@aave/client-next/test-utils';
import { describe, expect, it } from 'vitest';

describe('Aave V4 Spokes Scenario', () => {
  describe('Given a user who wants to fetch spokes by chain ID', () => {
    it('Then it should return the spokes', async () => {
      const spokesResult = await spokes(client, {
        chainIds: [chainId(123456789)],
      });
      assertOk(spokesResult);
      expect(spokesResult.value).toMatchSnapshot();
    });
  });

  describe('Given a user who wants to fetch spokes in a hub', () => {
    it('Then it should return the spokes', async () => {
      const spokesResult = await spokes(client, {
        hub: {
          chainId: ETHEREUM_FORK_ID,
          address: ETHEREUM_HUBS.CORE_HUB,
        },
      });
      assertOk(spokesResult);
      expect(spokesResult.value).toMatchSnapshot();
    });
  });
});
