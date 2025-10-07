import {
  assertOk,
  bigDecimal,
  evmAddress,
  type Reserve,
} from '@aave/client-next';
import {
  permitTypedData,
  supply,
  userSupplies,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReserveToSupply, supplyToReserve } from '../borrow/helper';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Aave V4 Supply Scenarios', () => {
  describe('Given a user and a Reserve', () => {
    describe('When the user supplies tokens', () => {
      const amountToSupply = bigDecimal('94');

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('100'),
          decimals: 6,
        });

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
              chainId: ETHEREUM_FORK_ID,
              spoke: reserveToSupply.value.spoke.address,
            },
            amount: {
              erc20: {
                value: amountToSupply,
              },
            },
            sender: evmAddress(user.account.address),
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction)
            .andThen(() =>
              userSupplies(client, {
                query: {
                  userSpoke: {
                    spoke: {
                      address: reserveToSupply.value.spoke.address,
                      chainId: ETHEREUM_FORK_ID,
                    },
                    user: evmAddress(user.account.address),
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
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('100'),
          decimals: 6,
        }).andThen(() => findReserveToSupply(client, ETHEREUM_USDC_ADDRESS));

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
            sender: evmAddress(user.account.address),
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
                user: evmAddress(user.account.address),
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

    // TODO: Refactor scenario, because in V4 only Positions Manager can supply on behalf of another address
    describe('When the user supplies tokens on behalf of another address', () => {
      it.todo(`Then the other address's supply positions are updated`);
    });

    describe('When the user supplies tokens using a permit signature', () => {
      const amountToSupply = bigDecimal('94');
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('100'),
          decimals: 6,
        }).andThen(() => findReserveToSupply(client, ETHEREUM_USDC_ADDRESS));

        assertOk(setup);
        reserve = setup.value;
      });
      it('Then the supply succeeds without requiring ERC20 approval', async ({
        annotate,
      }) => {
        const signature = await permitTypedData(client, {
          supply: {
            amount: {
              value: amountToSupply,
            },
            reserve: {
              reserveId: reserve.id,
              chainId: reserve.chain.chainId,
              spoke: reserve.spoke.address,
            },
            sender: evmAddress(user.account.address),
          },
        }).andThen(signERC20PermitWith(user));
        assertOk(signature);

        const result = await supply(client, {
          reserve: {
            reserveId: reserve.id,
            chainId: ETHEREUM_FORK_ID,
            spoke: reserve.spoke.address,
          },
          amount: {
            erc20: {
              value: amountToSupply,
              permitSig: signature.value,
            },
          },
          sender: evmAddress(user.account.address),
        })
          .andTee((tx) =>
            annotate(`plan supply with permit: ${JSON.stringify(tx, null, 2)}`),
          )
          .andTee((tx) => expect(tx.__typename).toEqual('TransactionRequest'))
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: ETHEREUM_FORK_ID,
                  },
                  user: evmAddress(user.account.address),
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

    // TODO: Refactor scenario, because in V4 only Positions Manager can supply on behalf of another address
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
