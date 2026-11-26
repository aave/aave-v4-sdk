import type { AaveClient } from '@aave/client';
import {
  ActivitiesQuery,
  encodeReserveId,
  encodeSpokeId,
  encodeUserPositionId,
  HubsQuery,
  ReservesQuery,
  UserBalancesQuery,
  UserBorrowsQuery,
  UserPositionQuery,
  UserPositionsQuery,
  UserRiskPremiumBreakdownQuery,
  UserSummaryHistoryQuery,
  UserSummaryQuery,
  UserSuppliesQuery,
} from '@aave/graphql';
import { chainId, evmAddress, ResultAsync } from '@aave/types';
import { describe, expect, it } from 'vitest';
import {
  refreshAfterOrderSettled,
  refreshQueriesForReserveChange,
  refreshUserActivities,
  refreshUserPositions,
  refreshUserRiskPremium,
  refreshUserSummary,
  refreshUserSummaryHistory,
} from './cache';

const user = evmAddress('0x1111111111111111111111111111111111111111');
const other = evmAddress('0x2222222222222222222222222222222222222222');
const spokeA = evmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const spokeB = evmAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
const avalanche = chainId(43114);
const ethereum = chainId(1);
const reserve = (spoke: typeof spokeA, onChainId: number) =>
  encodeReserveId({ chainId: avalanche, spoke, onChainId: onChainId as never });
const collateral = reserve(spokeA, 0);
const debt = reserve(spokeA, 3);
const positionA = encodeUserPositionId({
  chainId: avalanche,
  spoke: spokeA,
  user,
});
const positionB = encodeUserPositionId({
  chainId: avalanche,
  spoke: spokeB,
  user,
});
const spokeInputA = { chainId: avalanche, address: spokeA };

type Registered = {
  label: string;
  document: unknown;
  variables: unknown;
  data: unknown;
};

/**
 * What the real client does: for every query it has seen, read its cached value and
 * ask the predicate whether to refresh it. Records which labels matched.
 */
function fakeClient(registered: Registered[]) {
  const refreshed = new Set<string>();
  const client = {
    refreshQueryWhere: (
      document: unknown,
      predicate: (variables: never, data: never) => boolean | Promise<boolean>,
    ) =>
      ResultAsync.fromSafePromise(
        (async () => {
          for (const entry of registered) {
            if (entry.document !== document || entry.data == null) continue;
            if (
              await predicate(entry.variables as never, entry.data as never)
            ) {
              refreshed.add(entry.label);
            }
          }
        })(),
      ),
  } as unknown as AaveClient;
  return { client, refreshed };
}

const positionData = (spoke: typeof spokeA) => ({
  id: encodeUserPositionId({ chainId: avalanche, spoke, user }),
  user,
  spoke: { chain: { chainId: avalanche }, address: spoke },
});

// The queries a dashboard and a position page keep on screen
const page = (): Registered[] => [
  {
    label: 'positions',
    document: UserPositionsQuery,
    variables: {
      request: { user, filter: { chainIds: [ethereum, avalanche] } },
    },
    data: [positionData(spokeB)],
  },
  {
    label: 'positions:other-user',
    document: UserPositionsQuery,
    variables: { request: { user: other, filter: { chainIds: [avalanche] } } },
    data: [],
  },
  {
    label: 'position',
    document: UserPositionQuery,
    variables: { request: { id: positionA } },
    data: positionData(spokeA),
  },
  {
    label: 'summary',
    document: UserSummaryQuery,
    variables: { request: { user, filter: { chainIds: [avalanche] } } },
    data: {},
  },
  {
    label: 'summary:other-chain',
    document: UserSummaryQuery,
    variables: { request: { user, filter: { chainIds: [ethereum] } } },
    data: {},
  },
  {
    label: 'history',
    document: UserSummaryHistoryQuery,
    variables: { request: { user, filter: { userPositionId: positionA } } },
    data: [],
  },
  {
    label: 'risk-premium',
    document: UserRiskPremiumBreakdownQuery,
    variables: { request: { user, query: { userPositionId: positionA } } },
    data: [],
  },
  {
    label: 'reserves',
    document: ReservesQuery,
    variables: { request: { user } },
    data: [{ id: collateral }, { id: debt }],
  },
  {
    label: 'hubs',
    document: HubsQuery,
    variables: { request: {} },
    data: [{ chain: { chainId: avalanche } }],
  },
  {
    label: 'supplies',
    document: UserSuppliesQuery,
    variables: {
      request: { query: { userChains: { user, chainIds: [avalanche] } } },
    },
    data: [],
  },
  {
    label: 'borrows',
    document: UserBorrowsQuery,
    variables: {
      request: { query: { userChains: { user, chainIds: [avalanche] } } },
    },
    data: [],
  },
  {
    label: 'balances',
    document: UserBalancesQuery,
    variables: { request: { user } },
    data: [],
  },
  {
    label: 'activities',
    document: ActivitiesQuery,
    variables: { request: { user, query: { chainIds: [avalanche] } } },
    data: {},
  },
  {
    label: 'activities:tx',
    document: ActivitiesQuery,
    variables: {
      request: { user, query: { txHash: { chainId: avalanche, hash: '0x' } } },
    },
    data: {},
  },
];

const POSITION_SET = [
  'positions',
  'position',
  'summary',
  'history',
  'risk-premium',
  'reserves',
  'hubs',
  'supplies',
  'borrows',
  'balances',
  'activities',
];
const sorted = (set: Set<string>) => [...set].sort();

describe('Given the cache refresh helpers', () => {
  describe('When a plain supply, borrow, repay or withdraw confirms', () => {
    it('Then it should refresh everything the position shows, and nothing of another user or chain', async () => {
      const { client, refreshed } = fakeClient(page());
      await refreshQueriesForReserveChange(client, {
        reserve: collateral,
        sender: user,
      } as never);
      expect(sorted(refreshed)).toEqual(POSITION_SET.sort());
    });
  });

  describe('When an order settles', () => {
    it.each([
      'SupplySwap',
      'BorrowSwap',
      'RepayWithSupply',
      'WithdrawSwap',
      'Leverage',
    ])(
      'Then a %s should refresh the same set as a plain transaction, on the reserves its legs move',
      async (typename) => {
        const leg = (id: unknown) => ({ reserve: { id } });
        const legs: Record<string, object> = {
          SupplySwap: { sell: leg(collateral), buy: leg(debt) },
          BorrowSwap: { sell: leg(debt), buy: leg(collateral) },
          RepayWithSupply: { repay: leg(debt), supply: leg(collateral) },
          WithdrawSwap: { withdraw: leg(collateral), buy: {} },
          Leverage: { collateral: leg(collateral), debt: leg(debt) },
        };
        const { client, refreshed } = fakeClient(page());
        await refreshAfterOrderSettled(client, user, {
          operation: { __typename: typename, ...legs[typename] },
        } as never);
        expect(sorted(refreshed)).toEqual(POSITION_SET.sort());
      },
    );

    it('Then a token swap should refresh the wallet and the activity only', async () => {
      const { client, refreshed } = fakeClient(page());
      await refreshAfterOrderSettled(client, user, {
        operation: { __typename: 'TokenSwap', sell: {}, buy: {} },
      } as never);
      expect(sorted(refreshed)).toEqual(['activities', 'balances']);
    });
  });

  describe('When a first action on a spoke opens a position the cached list does not hold yet', () => {
    it('Then it should still refresh the list, matched on what it asked for', async () => {
      const { client, refreshed } = fakeClient(page());
      await refreshUserPositions(client, user, spokeInputA);
      expect(refreshed.has('positions')).toBe(true);
      expect(refreshed.has('positions:other-user')).toBe(false);
    });
  });

  describe('When the summary, chart or risk premium are filtered', () => {
    it.each([
      ['spoke', { spoke: spokeInputA }, true],
      ['spokeId', { spokeId: encodeSpokeId(spokeInputA) }, true],
      ['chainIds', { chainIds: [avalanche] }, true],
      ['userPositionId', { userPositionId: positionA }, true],
      ['no filter', null, true],
      ['another chain', { chainIds: [ethereum] }, false],
      ['another position', { userPositionId: positionB }, false],
    ])(
      'Then a summary and a chart filtered by %s should refresh: %s',
      async (_, filter, expected) => {
        const registered: Registered[] = [
          {
            label: 'summary',
            document: UserSummaryQuery,
            variables: { request: { user, filter } },
            data: {},
          },
          {
            label: 'history',
            document: UserSummaryHistoryQuery,
            variables: { request: { user, filter } },
            data: [],
          },
        ];
        const { client, refreshed } = fakeClient(registered);
        await refreshUserSummary(client, user, spokeInputA);
        await refreshUserSummaryHistory(client, user, spokeInputA);
        expect(refreshed.has('summary')).toBe(expected);
        expect(refreshed.has('history')).toBe(expected);
      },
    );

    it.each([
      [
        'userSpoke',
        { userSpoke: { spoke: encodeSpokeId(spokeInputA), user } },
        true,
      ],
      ['userPositionId', { userPositionId: positionA }, true],
      ['another position', { userPositionId: positionB }, false],
    ])(
      'Then a risk premium breakdown queried by %s should refresh: %s',
      async (_, query, expected) => {
        const { client, refreshed } = fakeClient([
          {
            label: 'risk-premium',
            document: UserRiskPremiumBreakdownQuery,
            variables: { request: { user, query } },
            data: [],
          },
        ]);
        await refreshUserRiskPremium(client, user, spokeInputA);
        expect(refreshed.has('risk-premium')).toBe(expected);
      },
    );
  });

  describe('When the activity is refreshed', () => {
    it("Then it should refresh the user's lists but not a query for one tx hash, nor another user", async () => {
      const { client, refreshed } = fakeClient([
        ...page(),
        {
          label: 'activities:other-user',
          document: ActivitiesQuery,
          variables: {
            request: { user: other, query: { chainIds: [avalanche] } },
          },
          data: {},
        },
      ]);
      await refreshUserActivities(client, user);
      expect(sorted(refreshed)).toEqual(['activities']);
    });
  });
});
