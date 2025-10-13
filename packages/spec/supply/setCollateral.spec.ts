import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import {
  setUserSupplyAsCollateral,
  userSupplies,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReserveToSupply, supplyToReserve } from '../borrow/helper';
import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet();

describe('Setting Supply as Collateral in Aave V4', () => {
  describe('Given a user with a supply position disabled as collateral', () => {
    describe('When the user sets the position as collateral', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('100'),
          decimals: 6,
        })
          .andThen(() =>
            findReserveToSupply(client, user, {
              token: ETHEREUM_USDC_ADDRESS,
            }),
          )
          .andThen((reserve) =>
            supplyToReserve(
              client,
              {
                reserve: {
                  chainId: reserve.chain.chainId,
                  reserveId: reserve.id,
                  spoke: reserve.spoke.address,
                },
                amount: {
                  erc20: {
                    value: bigDecimal('100'),
                  },
                },
                sender: evmAddress(user.account.address),
                enableCollateral: false,
              },
              user,
            ),
          );

        assertOk(setup);
      }, 60_000);

      it('Then the position should be enabled as collateral', async () => {
        const positions = await userSupplies(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(positions);
        assertNonEmptyArray(positions.value);
        expect(positions.value[0].isCollateral).toBe(false);

        const result = await setUserSupplyAsCollateral(client, {
          enableCollateral: true,
          reserve: {
            reserveId: positions.value[0].reserve.id,
            spoke: positions.value[0].reserve.spoke.address,
            chainId: positions.value[0].reserve.chain.chainId,
          },
          sender: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userChains: {
                  chainIds: [ETHEREUM_FORK_ID],
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);

        assertNonEmptyArray(result.value);
        expect(result.value[0].isCollateral).toBe(true);
      });
    });
  });
});
