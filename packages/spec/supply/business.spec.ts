import {
  assertOk,
  bigDecimal,
  chainId,
  evmAddress,
  type Reserve,
} from '@aave/client-next';
import { supply, userSupplies } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReserveToSupply, supplyToReserve } from '../borrow/helper';
import { assertSingleElementArray } from '../test-utils';

describe('Aave V4 Supply Scenarios', () => {
  describe('Given a user and a Reserve', () => {
    describe('When the user supplies tokens', () => {
      const user = createNewWallet();
      const amountToSupply = bigDecimal('94');

      beforeAll(async () => {
        const setup = await fundErc20Address(
          evmAddress(user.account!.address),
          {
            address: ETHEREUM_USDC_ADDRESS,
            amount: bigDecimal('100'),
            decimals: 6,
          },
        );

        assertOk(setup);
      });

      describe("Then the user's supply positions are updated", async () => {
        it('And the supplied tokens are set as collateral by default', async () => {
          const reserveToSupply = await findReserveToSupply(
            client,
            ETHEREUM_USDC_ADDRESS,
          );
          assertOk(reserveToSupply);

          const result = await supply(client, {
            reserve: {
              reserveId: reserveToSupply.value.id,
              chainId: chainId(1),
              spoke: reserveToSupply.value.spoke.address,
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
                      address: reserveToSupply.value.spoke.address,
                      chainId: chainId(1),
                    },
                    user: evmAddress(user.account!.address),
                  },
                },
              }),
            );
          assertOk(result);

          assertSingleElementArray(result.value);
          expect(result.value[0].isCollateral).toBe(true);
          expect(result.value[0].amount.value.formatted).toBeBigDecimalCloseTo(
            amountToSupply,
            2,
          );
        });
      });
    });

    describe('When the user supplies tokens with collateral disabled', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          evmAddress(user.account!.address),
          {
            address: ETHEREUM_USDC_ADDRESS,
            amount: bigDecimal('100'),
            decimals: 6,
          },
        ).andThen(() => findReserveToSupply(client, ETHEREUM_USDC_ADDRESS));

        assertOk(setup);
        reserve = setup.value;
      });

      it(`Then the user's supply positions are updated without collateral`, async () => {
        const result = await supplyToReserve(
          client,
          {
            reserve: {
              spoke: reserve.spoke.address,
              reserveId: reserve.id,
              chainId: reserve.chain.chainId,
            },
            amount: {
              erc20: {
                value: bigDecimal('50'),
              },
            },
            sender: evmAddress(user.account!.address),
            enableCollateral: false,
          },
          user,
        ).andThen(() =>
          userSupplies(client, {
            query: {
              userSpoke: {
                spoke: {
                  address: reserve.spoke.address,
                  chainId: reserve.chain.chainId,
                },
                user: evmAddress(user.account!.address),
              },
            },
          }),
        );
        assertOk(result);
        assertSingleElementArray(result.value);
        expect(result.value[0].isCollateral).toBe(false);
        expect(result.value[0].amount.value.formatted).toBeBigDecimalCloseTo(
          bigDecimal('50'),
          2,
        );
      });
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
