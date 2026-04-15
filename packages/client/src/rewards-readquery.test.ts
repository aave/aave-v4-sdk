/**
 * Verification test for The Assignment from the design doc:
 *
 *   "Before writing any code: verify that `this.urql.readQuery(UserClaimableRewardsQuery, vars)`
 *   inside the exchange closure returns resolved entity objects (not graphcache internal refs)
 *   for the `UserMerklClaimableReward` union type."
 *
 * Why this matters: the claimResponseTransformExchange synthetic short-circuit reads the current
 * cache via `readQuery`, filters claimed reward IDs, and returns a synthetic OperationResult.
 * If `readQuery` returns graphcache entity refs (strings like "UserMerklClaimableReward:0x...")
 * instead of resolved objects, the `.id` filter would fail and the implementation path changes.
 *
 * Result: readQuery returns fully resolved objects. The `.id` field is a plain string.
 * Filter on `.id` in the claimResponseTransformExchange can proceed as designed.
 */

import { type RewardId, UserClaimableRewardsQuery } from '@aave/graphql';
import { assertOk, chainId, evmAddress } from '@aave/types';
import * as msw from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AaveClient } from './AaveClient';
import { userClaimableRewards } from './actions';

const TEST_BACKEND = 'https://api.test-verify.aave.com/graphql';

const testEnvironment = {
  name: 'test',
  backend: TEST_BACKEND,
  indexingTimeout: 5_000,
  pollingInterval: 100,
  exchangeRateInterval: 1_000,
  swapQuoteInterval: 1_000,
  swapStatusInterval: 1_000,
} as const;

const api = msw.graphql.link(TEST_BACKEND);

const MOCK_USER = evmAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
const MOCK_CHAIN_ID = chainId(1);

const MOCK_REWARD_ID = 'merkl-reward-0x1234';
const MOCK_REWARD_ID_2 = 'merkl-reward-0x5678';

/**
 * Minimal mock data for a UserMerklClaimableReward entity.
 * Includes all fields from UserMerklClaimableRewardFragment + nested Erc20AmountFragment.
 */
function makeMockReward(id: string) {
  return {
    __typename: 'UserMerklClaimableReward',
    id,
    claimable: {
      __typename: 'Erc20Amount',
      token: {
        __typename: 'Erc20Token',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        info: {
          __typename: 'TokenInfo',
          id: 'token-info-usdc',
          name: 'USD Coin',
          symbol: 'USDC',
          icon: null,
          decimals: 6,
          categories: [],
        },
        chain: {
          __typename: 'Chain',
          name: 'Ethereum',
          icon: null,
          chainId: 1,
          rpcUrl: 'https://eth.llamarpc.com',
          explorerUrl: 'https://etherscan.io',
          isTestnet: false,
          isFork: false,
          nativeWrappedToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          nativeGateway: '0x0000000000000000000000000000000000000000',
          signatureGateway: '0x0000000000000000000000000000000000000000',
          nativeInfo: {
            __typename: 'TokenInfo',
            id: 'token-info-eth',
            name: 'Ether',
            symbol: 'ETH',
            icon: null,
            decimals: 18,
            categories: [],
          },
        },
        isWrappedNativeToken: false,
      },
      amount: {
        __typename: 'DecimalNumber',
        onChainValue: '1000000',
        decimals: 6,
        value: '1',
      },
      exchange: {
        __typename: 'ExchangeAmount',
        value: '1',
        name: 'USD Coin',
        symbol: 'USD',
        icon: null,
        decimals: 2,
      },
      exchangeRate: {
        __typename: 'DecimalNumber',
        onChainValue: '1000000',
        decimals: 6,
        value: '1',
      },
    },
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.000Z',
    claimUntil: '2025-12-31T23:59:59.000Z',
  };
}

describe('Given a post-claim cache-first read after markRewardsClaimed', () => {
  // Fresh client — exchange pipeline is [queryTracking, claimResponseTransform, graphcache, fetch]
  const client = AaveClient.create({
    environment: testEnvironment,
    batch: false,
  });

  const server = setupServer(
    api.query('UserClaimableRewards', () =>
      msw.HttpResponse.json({
        data: {
          value: [
            makeMockReward(MOCK_REWARD_ID),
            makeMockReward(MOCK_REWARD_ID_2),
          ],
        },
      }),
    ),
  );

  beforeAll(async () => {
    server.listen();
    // Prime graphcache with both rewards via a network fetch.
    const primed = await userClaimableRewards(client, {
      user: MOCK_USER,
      chainId: MOCK_CHAIN_ID,
    });
    assertOk(primed);
  });

  afterAll(() => {
    server.close();
  });

  it('Then a cache-first read after markRewardsClaimed does not return the claimed reward', async () => {
    // Record the claim — populates pendingRewardRemovals synchronously.
    client.markRewardsClaimed(MOCK_USER, MOCK_CHAIN_ID, [
      MOCK_REWARD_ID as RewardId,
    ]);

    // cache-first: graphcache serves the result from its normalized store without a
    // network round-trip. The response flows back through claimResponseTransformExchange
    // which strips the claimed ID from the result before it reaches the caller.
    const result = await userClaimableRewards(
      client,
      { user: MOCK_USER, chainId: MOCK_CHAIN_ID },
      { requestPolicy: 'cache-first' },
    );

    assertOk(result);
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.id).toBe(MOCK_REWARD_ID_2);
  });
});

describe('Given the AaveClient graphcache with UserMerklClaimableReward entities', () => {
  // Fresh client per describe block so cache state is isolated
  const client = AaveClient.create({
    environment: testEnvironment,
    batch: false, // simplifies MSW mocking — no batching handler needed
  });

  const server = setupServer(
    // Use the operation name string (not the typed document) so MSW doesn't
    // validate the mock response body against the generated TypeScript types.
    api.query('UserClaimableRewards', () =>
      msw.HttpResponse.json({
        data: {
          value: [
            makeMockReward(MOCK_REWARD_ID),
            makeMockReward(MOCK_REWARD_ID_2),
          ],
        },
      }),
    ),
  );

  beforeAll(async () => {
    server.listen();
    // Prime the cache once so both tests below can read from it independently.
    const primed = await userClaimableRewards(client, {
      user: MOCK_USER,
      chainId: MOCK_CHAIN_ID,
    });
    assertOk(primed);
  });

  afterAll(() => {
    server.close();
  });

  describe('When readQuery is called after priming the cache', () => {
    it('Then it returns resolved entity objects, not graphcache internal refs', () => {
      // Read back directly from graphcache — no network request
      const cached = client.urql.readQuery(UserClaimableRewardsQuery, {
        request: { user: MOCK_USER, chainId: MOCK_CHAIN_ID },
      });

      expect(cached).not.toBeNull();
      expect(cached?.data?.value).toHaveLength(2);

      const firstReward = cached?.data?.value?.[0];
      const secondReward = cached?.data?.value?.[1];

      // KEY ASSERTION: resolved object, not a graphcache ref string
      // If refs were returned, these would be strings like 'UserMerklClaimableReward:merkl-reward-0x1234'
      expect(typeof firstReward).toBe('object');
      expect(typeof secondReward).toBe('object');

      // The .id field must be the plain RewardId string — not a graphcache key format
      expect(firstReward?.id).toBe(MOCK_REWARD_ID);
      expect(secondReward?.id).toBe(MOCK_REWARD_ID_2);

      // Confirm __typename is correct (union type resolved to concrete type)
      expect(firstReward?.__typename).toBe('UserMerklClaimableReward');

      // Date fields should be Date instances (graphcache resolver transforms them)
      expect(firstReward?.startDate).toBeInstanceOf(Date);
      expect(firstReward?.endDate).toBeInstanceOf(Date);
      expect(firstReward?.claimUntil).toBeInstanceOf(Date);
    });

    it('Then filtering by .id works correctly (validates the exchange filter logic)', () => {
      const cached = client.urql.readQuery(UserClaimableRewardsQuery, {
        request: { user: MOCK_USER, chainId: MOCK_CHAIN_ID },
      });

      const currentData = cached?.data?.value ?? [];
      const claimedIds = new Set([MOCK_REWARD_ID]);

      // This is the exact filter expression used in claimResponseTransformExchange
      const filtered = currentData.filter(
        (r: { id: string }) => !claimedIds.has(r.id),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe(MOCK_REWARD_ID_2);
    });
  });
});
