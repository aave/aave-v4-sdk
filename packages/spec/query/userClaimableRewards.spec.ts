import { assertOk, evmAddress } from '@aave/client';
import { userClaimableRewards } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
} from '@aave/client/testing';
import { describe, expect, it } from 'vitest';

const userWithActivity = await createNewWallet();

describe('Given a user who may have rewards', () => {
  describe('When fetching user claimable rewards', () => {
    it('Then it returns valid claimable rewards data', async () => {
      const result = await userClaimableRewards(client, {
        user: evmAddress(userWithActivity.account.address),
        chainId: ETHEREUM_FORK_ID,
      });
      assertOk(result);

      if (result.value.length === 0) {
        expect(result.value).toEqual([]);
        return;
      }

      expect(result.value).toBeArrayWithElements(
        expect.objectContaining({
          __typename: 'UserMerklClaimableReward',
          id: expect.any(String),
          claimable: expect.objectContaining({
            amount: expect.any(Object),
            token: expect.objectContaining({
              address: expect.any(String),
              info: expect.objectContaining({
                symbol: expect.any(String),
                decimals: expect.any(Number),
              }),
            }),
          }),
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          claimUntil: expect.any(Date),
        }),
      );

      for (const reward of result.value) {
        expect(reward.claimable.amount.value.gt(0)).toBe(true);
        expect(reward.startDate.getTime()).toBeLessThanOrEqual(
          reward.endDate.getTime(),
        );
        expect(reward.endDate.getTime()).toBeLessThanOrEqual(
          reward.claimUntil.getTime(),
        );
      }
    });
  });
});

describe('Given a fresh user with no history', () => {
  describe('When fetching user claimable rewards', () => {
    it('Then no rewards are returned', async () => {
      const freshUser = await createNewWallet();
      const result = await userClaimableRewards(client, {
        user: evmAddress(freshUser.account.address),
        chainId: ETHEREUM_FORK_ID,
      });
      assertOk(result);
      expect(result.value).toEqual([]);
    });
  });
});

describe('Given the same user queried multiple times', () => {
  describe('When fetching claimable rewards repeatedly', () => {
    it('Then the same set of reward IDs is returned', async () => {
      const first = await userClaimableRewards(client, {
        user: evmAddress(userWithActivity.account.address),
        chainId: ETHEREUM_FORK_ID,
      });
      assertOk(first);

      const second = await userClaimableRewards(client, {
        user: evmAddress(userWithActivity.account.address),
        chainId: ETHEREUM_FORK_ID,
      });
      assertOk(second);

      const firstIds = first.value.map((reward) => reward.id).sort();
      const secondIds = second.value.map((reward) => reward.id).sort();

      expect(secondIds).toEqual(firstIds);
    });
  });
});
