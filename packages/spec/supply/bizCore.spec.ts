import { reserves, supply, userSupplies } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import {
  assertOk,
  bigDecimal,
  chainId,
  evmAddress,
  invariant,
} from '@aave/types-next';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Aave V4 Supply Scenarios', () => {
  describe('Given a user and a Reserve', () => {
    describe('When the user supplies tokens', () => {
      const user = createNewWallet();
      const amountToSupply = bigDecimal('94');

      beforeAll(async () => {
        const setup = await fundErc20Address(
          ETHEREUM_USDC_ADDRESS,
          evmAddress(user.account!.address),
          bigDecimal('100'),
          6,
        );

        assertOk(setup);
      });

      describe("Then the user's supply positions are updated", async () => {
        it('And the supplied tokens are set as collateral by default', async () => {
          const listReserves = await reserves(client, {
            query: {
              token: {
                chainId: chainId(1),
                address: ETHEREUM_USDC_ADDRESS,
              },
            },
          });
          assertOk(listReserves);
          expect(listReserves.value.length > 0, 'No reserves found for USDC');
          const reserveToSupply = listReserves.value.find(
            (reserve) => reserve.canSupply === true,
          );
          invariant(reserveToSupply, 'No reserve found to supply to');

          const result = await supply(client, {
            reserve: {
              reserveId: reserveToSupply.id,
              chainId: chainId(1),
              spoke: reserveToSupply.spoke.address,
            },
            amount: {
              erc20: {
                value: amountToSupply,
              },
            },
            sender: evmAddress(user.account!.address),
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction)
            .andThen(() =>
              userSupplies(client, {
                query: {
                  userSpoke: {
                    spoke: {
                      address: reserveToSupply.spoke.address,
                      chainId: chainId(1),
                    },
                    user: evmAddress(user.account!.address),
                  },
                },
              }),
            );
          assertOk(result);

          expect(result.value.length > 0, 'No supply positions found');
          expect(
            result.value[0]?.isCollateral === true,
            'Supply position not set as collateral',
          );
          expect(
            result.value[0]?.amount.value.formatted === bigDecimal('10'),
            'Supply amount not correct',
          );
        });
      });
    });

    describe('When the user supplies tokens with collateral disabled', () => {
      it.todo(
        `Then the user's supply positions are updated without collateral`,
      );
    });

    describe('When the user supplies tokens on behalf of another address', () => {
      it.todo(`Then the other address's supply positions are updated`);
    });

    describe('When the user supplies tokens using a permit signature', () => {
      it.todo('Then the supply succeeds without requiring ERC20 approval');
    });

    describe('When the user supplies tokens on behalf of another address using a permit signature', () => {
      describe('Then the supply succeeds without requiring ERC20 approval', () => {
        it.todo(`And the other user's supply positions are updated`);
      });
    });

    describe('When the Reserve allows supplying native tokens', () => {
      describe('And the user supplies native tokens', () => {
        describe(`Then the use's supply positions are updated`, () => {
          it.todo(`And should appear in the user's supply positions`);
        });
      });
    });
  });
});
