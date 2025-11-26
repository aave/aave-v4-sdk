import { Currency, ReservesRequestFilter } from '@aave/graphql';
import {
  assertOk,
  BigDecimal,
  bigDecimal,
  evmAddress,
  never,
  ResultAsync,
} from '@aave/types';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  activities,
  exchangeRate,
  hub,
  hubs,
  reserves,
  supply,
} from './actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from './test-utils';
import { sendWith } from './viem';

const user = await createNewWallet();

describe('Given the Aave SDK normalized graph cache', () => {
  describe('when fetching any field of BigDecimal scalar type', () => {
    it('Then it should return a BigDecimal instance in its place', async () => {
      const result = await exchangeRate(client, {
        from: {
          native: ETHEREUM_FORK_ID,
        },
        to: Currency.Usd,
      });
      assertOk(result);
      expect(BigDecimal.isBigDecimal(result.value.value)).toBe(true);
    });
  });

  describe('when fetching any field of DateTime scalar type', () => {
    it('Then it should return a Date instance in its place', async () => {
      const result = await activities(client, {
        query: {
          chainIds: [ETHEREUM_FORK_ID],
        },
      });
      assertOk(result);
      expect(result.value.items[0]!.timestamp).toBeInstanceOf(Date);
    });
  });

  describe(`When fetching a single 'Hub' by hubId`, () => {
    it('Then it should leverage cached data whenever possible', async () => {
      const primed = await hubs(client, {
        query: {
          chainIds: [ETHEREUM_FORK_ID],
        },
      });
      assertOk(primed);

      const result = await hub(
        client,
        {
          query: {
            hubId: primed.value[0]!.id,
          },
        },
        {
          requestPolicy: 'cache-only',
        },
      );

      assertOk(result);
      expect(result.value).toEqual(primed.value[0]);
    });
  });

  describe(`When fetching a single 'Hub' by hubInput`, () => {
    it('Then it should leverage cached data whenever possible', async () => {
      const primed = await hubs(client, {
        query: {
          chainIds: [ETHEREUM_FORK_ID],
        },
      });
      assertOk(primed);
      const result = await hub(
        client,
        {
          query: {
            hubInput: {
              address: primed.value[0]!.address,
              chainId: ETHEREUM_FORK_ID,
            },
          },
        },
        {
          requestPolicy: 'cache-only',
        },
      );
      assertOk(result);
      expect(result.value).toEqual(primed.value[0]);
    });
  });

  describe('When fetching user history by tx hash', () => {
    beforeAll(async () => {
      const setup = await reserves(client, {
        query: {
          tokens: [
            {
              chainId: ETHEREUM_FORK_ID,
              address: ETHEREUM_USDC_ADDRESS,
            },
          ],
        },
        filter: ReservesRequestFilter.Supply,
      })
        .map(
          (list) =>
            list.find((reserve) => reserve.canSupply) ??
            never('No reserve found to supply to for the token'),
        )
        .andThen((reserve) =>
          fundErc20Address(evmAddress(user.account.address), {
            address: ETHEREUM_USDC_ADDRESS,
            amount: bigDecimal('1'),
            decimals: reserve.asset.underlying.info.decimals,
          }).andThen(() =>
            ResultAsync.combine([
              // supply activity 1
              supply(client, {
                sender: evmAddress(user.account.address),
                reserve: reserve.id,
                amount: {
                  erc20: {
                    value: bigDecimal('0.1'),
                  },
                },
              }),
              // supply activity 2
              supply(client, {
                sender: evmAddress(user.account.address),
                reserve: reserve.id,
                amount: {
                  erc20: {
                    value: bigDecimal('0.1'),
                  },
                },
              }),
            ]).andThen(([plan1, plan2]) =>
              sendWith(user, plan1)
                .andThen(client.waitForTransaction)
                .andThen(() =>
                  sendWith(user, plan2).andThen(client.waitForTransaction),
                ),
            ),
          ),
        );

      assertOk(setup);
    });

    it('Then it should leverage cached data whenever possible', async () => {
      const primed = await activities(client, {
        query: {
          chainIds: [ETHEREUM_FORK_ID],
        },
        user: evmAddress(user.account.address),
      });
      assertOk(primed);

      const result = await activities(
        client,
        {
          user: evmAddress(user.account.address),
          query: {
            txHash: {
              txHash:
                primed.value.items[0]?.txHash ?? never('Expected a tx hash'),
              chainId: ETHEREUM_FORK_ID,
            },
          },
        },
        {
          requestPolicy: 'cache-only',
        },
      );

      assertOk(result);
      expect(result.value.items[0]?.txHash).toEqual(
        primed.value.items[0]?.txHash,
      );
      expect(result.value.items[0]?.chain.chainId).toEqual(
        primed.value.items[0]?.chain.chainId,
      );
    });
  });
});
