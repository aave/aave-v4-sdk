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
import {
  findReserveNativeSupply,
  findReserveToSupply,
  supplyToReserve,
} from '../borrow/helper';

const user = await createNewWallet();

describe('Supplying Assets on Aave V4', () => {
  describe('Given a user and a reserve', () => {
    describe('When the user supplies tokens to the reserve', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('100'),
          decimals: 6,
        });

        assertOk(setup);
      });

      it("Then the user's supply position is updated and the tokens are enabled as collateral by default", async () => {
        const amountToSupply = bigDecimal('50');
        const reserveToSupply = await findReserveToSupply(client, user, {
          token: ETHEREUM_USDC_ADDRESS,
        });
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
            position.reserve.asset.underlying.address === ETHEREUM_USDC_ADDRESS
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

    describe('When the user supplies tokens with collateral disabled', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WETH_ADDRESS,
          amount: bigDecimal('1.0'),
        });

        assertOk(setup);
      });

      it("Then the user's supply position is updated and the tokens are not enabled as collateral", async () => {
        const reserve = await findReserveToSupply(client, user, {
          token: ETHEREUM_WETH_ADDRESS,
        });
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

    describe('When the user supplies tokens using a valid permit signature', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_GHO_ADDRESS,
          amount: bigDecimal('100'),
        });

        assertOk(setup);
      });

      it('Then the supply succeeds without prior ERC20 approval', async ({
        annotate,
      }) => {
        const amountToSupply = bigDecimal('50');
        const reserve = await findReserveToSupply(client, user, {
          token: ETHEREUM_GHO_ADDRESS,
        });
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
  });

  describe('Given a user and a reserve that supports native token deposits', () => {
    describe('When the user supplies native tokens', () => {
      // TODO: enable when contracts are deployed
      it.skip("Then the user's supply position is updated and the tokens are enabled as collateral by default", async () => {
        const reserve = await findReserveNativeSupply(client, user);
        assertOk(reserve);

        const result = await supplyToReserve(
          client,
          {
            reserve: {
              reserveId: reserve.value.id,
              chainId: reserve.value.chain.chainId,
              spoke: reserve.value.spoke.address,
            },
            amount: {
              native: bigDecimal('0.01'),
            },
            sender: evmAddress(user.account.address),
            enableCollateral: true,
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

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_WETH_ADDRESS
          );
        });
        invariant(supplyPosition, 'No supply position found');
      });
    });

    describe('When the user supplies native tokens with collateral disabled', () => {
      it("Then the user's supply position is updated without the tokens are disabled as collateral", async () => {
        const reserve = await findReserveNativeSupply(client, user);
        assertOk(reserve);

        const result = await supplyToReserve(
          client,
          {
            reserve: {
              reserveId: reserve.value.id,
              chainId: reserve.value.chain.chainId,
              spoke: reserve.value.spoke.address,
            },
            amount: {
              native: bigDecimal('0.01'),
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

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_WETH_ADDRESS
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(false);
      });
    });
  });
});
