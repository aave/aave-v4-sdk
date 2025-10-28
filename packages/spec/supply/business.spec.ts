import {
  assertOk,
  bigDecimal,
  Currency,
  evmAddress,
  invariant,
} from '@aave/client-next';
import {
  permitTypedData,
  preview,
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
          amount: bigDecimal('200'),
          decimals: 6,
        });

        assertOk(setup);
      });

      it('Then the supply position is updated and the tokens are enabled as collateral by default', async () => {
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
        expect(supplyPosition.isCollateral).toEqual(
          reserveToSupply.value.canUseAsCollateral,
        );
        expect(supplyPosition.withdrawable.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
          2,
        );
      });
    });

    describe('When the user wants to preview the supply action before performing it', () => {
      it('Then the user can review the supply details before proceeding', async () => {
        const amountToSupply = bigDecimal('50');
        const reserve = await findReserveToSupply(client, user, {
          token: ETHEREUM_USDC_ADDRESS,
        });
        assertOk(reserve);

        const previewResult = await preview(
          client,
          {
            action: {
              supply: {
                reserve: {
                  reserveId: reserve.value.id,
                  chainId: ETHEREUM_FORK_ID,
                  spoke: reserve.value.spoke.address,
                },
                amount: {
                  erc20: {
                    value: amountToSupply,
                  },
                },
                sender: evmAddress(user.account.address),
              },
            },
          },
          { currency: Currency.Usd },
        );
        assertOk(previewResult);
        expect(previewResult.value).toMatchSnapshot({
          id: expect.any(String),
          netBalance: expect.any(Object),
          netCollateral: expect.any(Object),
          netApy: expect.any(Object),
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

      it('Then the supply position is updated and the tokens are not enabled as collateral', async () => {
        const reserve = await findReserveToSupply(client, user, {
          token: ETHEREUM_WETH_ADDRESS,
        });
        assertOk(reserve);
        const amountToSupply = bigDecimal('0.1');

        const result = await supplyToReserve(client, user, {
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
        }).andThen(() =>
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
        expect(supplyPosition.withdrawable.amount.value).toBeBigDecimalCloseTo(
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

      it('Then the supply is processed without requiring prior ERC20 approval', async ({
        annotate,
      }) => {
        annotate(`account address: ${evmAddress(user.account.address)}`);
        const amountToSupply = bigDecimal('50');
        const reserve = await findReserveToSupply(client, user, {
          token: ETHEREUM_GHO_ADDRESS,
        });
        assertOk(reserve);
        annotate(`reserve id: ${reserve.value.id}`);

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
        expect(supplyPosition.isCollateral).toEqual(
          reserve.value.canUseAsCollateral,
        );
        expect(supplyPosition.withdrawable.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
          1,
        );
      });
    });
  });

  describe('Given a user and a reserve that supports native token deposits', () => {
    describe('When the user wants to preview the supply action before performing it', () => {
      it('Then the user can review the supply details before proceeding', async () => {
        const amountToSupply = bigDecimal('0.01');
        const reservePreview = await findReserveNativeSupply(
          client,
          user,
        ).andThen((reserve) =>
          preview(
            client,
            {
              action: {
                supply: {
                  reserve: {
                    reserveId: reserve.id,
                    chainId: ETHEREUM_FORK_ID,
                    spoke: reserve.spoke.address,
                  },
                  amount: {
                    native: amountToSupply,
                  },
                  sender: evmAddress(user.account.address),
                },
              },
            },
            { currency: Currency.Eur },
          ),
        );
        assertOk(reservePreview);
        expect(reservePreview.value).toMatchSnapshot({
          id: expect.any(String),
          netBalance: expect.any(Object),
          netCollateral: expect.any(Object),
          netApy: expect.any(Object),
        });
      });
    });

    describe('When the user supplies native tokens', () => {
      // TODO: enable when contracts are deployed
      it.skip('Then the supply position is updated and the tokens are enabled as collateral by default', async () => {
        const reserve = await findReserveNativeSupply(client, user);
        assertOk(reserve);

        const result = await supplyToReserve(client, user, {
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
        }).andThen(() =>
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
      it('Then the supply position is updated and the tokens are not enabled as collateral', async () => {
        const reserve = await findReserveNativeSupply(client, user);
        assertOk(reserve);

        const result = await supplyToReserve(client, user, {
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
        }).andThen(() =>
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
