import { ReservesRequestFilter } from '@aave/graphql-next';
import {
  assertOk,
  bigDecimal,
  chainId,
  evmAddress,
  never,
  nonNullable,
} from '@aave/types-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { hub, hubs, reserves, supply, userHistory } from './actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_WETH_ADDRESS,
} from './test-utils';
import { sendWith } from './viem';

const user = await createNewWallet();

describe('Given the Aave SDK normalized graph cache', () => {
  describe(`When fetching a single 'Hub'`, () => {
    it('Then it should leverage cached data whenever possible', async () => {
      const primed = await hubs(client, {
        query: {
          chainIds: [chainId(1)],
        },
      });
      assertOk(primed);

      const result = await hub(
        client,
        {
          hub: nonNullable(primed.value[0]).address,
          chainId: nonNullable(primed.value[0]).chain.chainId,
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
              address: ETHEREUM_WETH_ADDRESS,
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
          // supply activity 1
          supply(client, {
            sender: evmAddress(user.account.address),
            reserve: {
              chainId: reserve.chain.chainId,
              reserveId: reserve.id,
              spoke: reserve.spoke.address,
            },
            amount: {
              native: bigDecimal('0.1'),
            },
            enableCollateral: false, // workaround temporary contracts limitations
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction)
            .andThen(() =>
              // supply activity 2
              supply(client, {
                sender: evmAddress(user.account.address),
                reserve: {
                  chainId: reserve.chain.chainId,
                  reserveId: reserve.id,
                  spoke: reserve.spoke.address,
                },
                amount: {
                  native: bigDecimal('0.1'),
                },
                enableCollateral: false, // workaround temporary contracts limitations
              })
                .andThen(sendWith(user))
                .andThen(client.waitForTransaction),
            ),
        );

      assertOk(setup);
    });

    it('Then it should leverage cached data whenever possible', async () => {
      const primed = await userHistory(client, {
        user: evmAddress(user.account.address),
        filter: {
          chainIds: [ETHEREUM_FORK_ID],
        },
      });
      assertOk(primed);

      const result = await userHistory(
        client,
        {
          user: evmAddress(user.account.address),
          filter: {
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
      expect(result.value.items[0]).toEqual(primed.value.items[0]);
    });
  });
});
