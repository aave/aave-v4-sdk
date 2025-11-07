import {
  assertOk,
  bigDecimal,
  Currency,
  evmAddress,
  invariant,
  type Reserve,
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
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDS_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import type { NonEmptyTuple } from 'type-fest';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToSupply } from '../helpers/reserves';
import { supplyToReserve } from '../helpers/supplyBorrow';
import { sleep } from '../helpers/tools';

const user = await createNewWallet();

describe('Supplying Assets on Aave V4', () => {
  describe('Given a user and a reserve', () => {
    let listReserves: NonEmptyTuple<Reserve>;

    beforeAll(async () => {
      const result = await findReservesToSupply(client, user, {
        asCollateral: true,
      });
      assertOk(result);
      listReserves = result.value;
    });
    describe('When the user supplies tokens to a reserve', () => {
      beforeAll(async () => {
        const usdcReserve = listReserves.find(
          (ele) => ele.asset.underlying.address === ETHEREUM_USDC_ADDRESS,
        )!;
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: usdcReserve.asset.underlying.address,
          amount: bigDecimal('10'),
          decimals: usdcReserve.asset.underlying.info.decimals,
        });
        assertOk(setup);
      });

      it('Then the supply position is updated and the tokens are enabled as collateral by default', async () => {
        const usdcReserve = listReserves.find(
          (ele) => ele.asset.underlying.address === ETHEREUM_USDC_ADDRESS,
        )!;
        const amountToSupply = bigDecimal('9');
        const result = await supply(client, {
          reserve: usdcReserve.id,
          amount: {
            erc20: {
              value: amountToSupply,
            },
          },
          sender: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: usdcReserve.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            usdcReserve.asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(
          usdcReserve.canUseAsCollateral,
        );
        expect(supplyPosition.withdrawable.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
          2,
        );
      });
    });

    describe('When the user wants to preview the supply action before performing it', () => {
      it('Then the user can review the supply details before proceeding', async () => {
        const reserveToSupply = listReserves.find(
          (ele) => ele.asset.underlying.address === ETHEREUM_USDS_ADDRESS,
        )!;
        const previewResult = await preview(
          client,
          {
            action: {
              supply: {
                reserve: reserveToSupply.id,
                amount: {
                  erc20: {
                    value: bigDecimal('10'),
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
        const usdsReserve = listReserves.find(
          (ele) => ele.asset.underlying.address === ETHEREUM_USDS_ADDRESS,
        )!;
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: usdsReserve.asset.underlying.address,
          amount: bigDecimal('10'),
          decimals: usdsReserve.asset.underlying.info.decimals,
        });
        assertOk(setup);
      });

      it('Then the supply position is updated and the tokens are not enabled as collateral', async () => {
        const amountToSupply = bigDecimal('9');
        const usdsReserve = listReserves.find(
          (ele) => ele.asset.underlying.address === ETHEREUM_USDS_ADDRESS,
        )!;
        const result = await supplyToReserve(client, user, {
          reserve: usdsReserve.id,
          amount: {
            erc20: {
              value: amountToSupply,
            },
          },
          sender: evmAddress(user.account.address),
          enableCollateral: false,
        })
          .andTee(() => sleep(1000)) // TODO: Remove after fixed bug with delays of propagation
          .andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: usdsReserve.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);
        invariant(result.value, 'No supply positions found');
        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            usdsReserve.asset.underlying.address
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
      let reserveWithPermit: Reserve;

      beforeAll(async () => {
        reserveWithPermit = listReserves.find(
          (ele) => ele.asset.underlying.permitSupported === true,
        )!;
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: reserveWithPermit.asset.underlying.address,
          amount: bigDecimal('1'),
          decimals: reserveWithPermit.asset.underlying.info.decimals,
        });

        assertOk(setup);
      });

      it('Then the supply is processed without requiring prior ERC20 approval', async () => {
        const amountToSupply = bigDecimal('0.9');
        const signature = await permitTypedData(client, {
          supply: {
            amount: {
              value: amountToSupply,
            },
            reserve: reserveWithPermit.id,
            sender: evmAddress(user.account.address),
          },
        }).andThen(signERC20PermitWith(user));
        assertOk(signature);

        const result = await supply(client, {
          reserve: reserveWithPermit.id,
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
                  spoke: reserveWithPermit.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            reserveWithPermit.asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(
          reserveWithPermit.canUseAsCollateral,
        );
        expect(supplyPosition.withdrawable.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
          1,
        );
      });
    });
  });

  describe('Given a user and a reserve that supports native token deposits', () => {
    let nativeReserveToSupply: Reserve;

    beforeAll(async () => {
      const setup = await findReservesToSupply(client, user, {
        native: true,
      });
      assertOk(setup);
      nativeReserveToSupply = setup.value[0];
      // NOTE: No need to fund native as by default the use has a balance of native tokens
    });
    describe('When the user wants to preview the supply action before performing it', () => {
      it('Then the user can review the supply details before proceeding', async () => {
        const amountToSupply = bigDecimal('0.01');
        const reservePreview = await preview(
          client,
          {
            action: {
              supply: {
                reserve: nativeReserveToSupply.id,
                amount: {
                  native: amountToSupply,
                },
                sender: evmAddress(user.account.address),
              },
            },
          },
          { currency: Currency.Eur },
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
        const result = await supplyToReserve(client, user, {
          reserve: nativeReserveToSupply.id,
          amount: {
            native: bigDecimal('0.01'),
          },
          sender: evmAddress(user.account.address),
          enableCollateral: true,
        }).andThen(() =>
          userSupplies(client, {
            query: {
              userSpoke: {
                spoke: nativeReserveToSupply.spoke.id,
                user: evmAddress(user.account.address),
              },
            },
          }),
        );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            nativeReserveToSupply.asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
      });
    });

    describe('When the user supplies native tokens with collateral disabled', () => {
      it('Then the supply position is updated and the tokens are not enabled as collateral', async () => {
        const result = await supplyToReserve(client, user, {
          reserve: nativeReserveToSupply.id,
          amount: {
            native: bigDecimal('0.01'),
          },
          sender: evmAddress(user.account.address),
          enableCollateral: false,
        }).andThen(() =>
          userSupplies(client, {
            query: {
              userSpoke: {
                spoke: nativeReserveToSupply.spoke.id,
                user: evmAddress(user.account.address),
              },
            },
          }),
        );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            nativeReserveToSupply.asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(false);
      });
    });
  });
});
