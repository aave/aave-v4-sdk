import { assertOk, bigDecimal, evmAddress, invariant } from '@aave/client-next';
import {
  permitTypedData,
  supply,
  userSupplies,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReserveToSupply, supplyToReserve } from '../borrow/helper';

const user = await createNewWallet();

describe('Aave V4 Supply Scenarios', () => {
  describe('Given a user and a Reserve', () => {
    describe('When the user supplies tokens', () => {
      describe("Then the user's supply positions are updated", async () => {
        beforeAll(async () => {
          const setup = await fundErc20Address(
            evmAddress(user.account.address),
            {
              address: ETHEREUM_USDC_ADDRESS,
              amount: bigDecimal('100'),
              decimals: 6,
            },
          );

          assertOk(setup);
        });
        it('And the supplied tokens are set as collateral by default', async () => {
          const amountToSupply = bigDecimal('50');
          const reserveToSupply = await findReserveToSupply(
            client,
            user,
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

          const supplyPosition = result.value.find((position) => {
            return (
              position.reserve.asset.underlying.address ===
              ETHEREUM_USDC_ADDRESS
            );
          });
          invariant(supplyPosition, 'No supply position found');
          expect(supplyPosition.isCollateral).toBe(true);
          expect(supplyPosition.amount.value.formatted).toBeBigDecimalCloseTo(
            amountToSupply,
            2,
          );
        });
      });
    });

    describe('When the user supplies tokens with collateral disabled', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WETH_ADDRESS,
          amount: bigDecimal('1.0'),
        });

        assertOk(setup);
      });

      it(`Then the user's supply positions are updated without collateral`, async () => {
        const reserve = await findReserveToSupply(
          client,
          user,
          ETHEREUM_WETH_ADDRESS,
        );
        assertOk(reserve);
        const amountToSupply = bigDecimal('0.1');

        const result = await supplyToReserve(
          client,
          {
            reserve: {
              spoke: reserve.value.spoke.address,
              reserveId: reserve.value.id,
              chainId: reserve.value.chain.chainId,
            },
            amount: {
              erc20: {
                value: amountToSupply,
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
                  address: reserve.value.spoke.address,
                  chainId: reserve.value.chain.chainId,
                },
                user: evmAddress(user.account.address),
              },
            },
          }),
        );
        assertOk(result);
        invariant(result.value, 'No supply positions found');
        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_WETH_ADDRESS
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(false);
        expect(supplyPosition.amount.value.formatted).toBeBigDecimalCloseTo(
          amountToSupply,
          3,
        );
      });
    });

    describe('When the user supplies tokens using a permit signature', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_GHO_ADDRESS,
          amount: bigDecimal('100'),
        });

        assertOk(setup);
      });
      it('Then the supply succeeds without requiring ERC20 approval', async ({
        annotate,
      }) => {
        const amountToSupply = bigDecimal('50');
        const reserve = await findReserveToSupply(
          client,
          user,
          ETHEREUM_GHO_ADDRESS,
        );
        assertOk(reserve);

        const signature = await permitTypedData(client, {
          supply: {
            amount: {
              value: amountToSupply,
            },
            reserve: {
              reserveId: reserve.value.id,
              chainId: reserve.value.chain.chainId,
              spoke: reserve.value.spoke.address,
            },
            sender: evmAddress(user.account.address),
          },
        }).andThen(signERC20PermitWith(user));
        assertOk(signature);

        const result = await supply(client, {
          reserve: {
            reserveId: reserve.value.id,
            chainId: reserve.value.chain.chainId,
            spoke: reserve.value.spoke.address,
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
                    address: reserve.value.spoke.address,
                    chainId: reserve.value.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_GHO_ADDRESS
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toBe(true);
        expect(supplyPosition.amount.value.formatted).toBeBigDecimalCloseTo(
          amountToSupply,
          2,
        );
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
