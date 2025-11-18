import {
  assertOk,
  bigDecimal,
  Currency,
  evmAddress,
  invariant,
  type Reserve,
} from '@aave/client';
import {
  permitTypedData,
  preview,
  supply,
  userSupplies,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_1INCH_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';

import { findReservesToSupply } from '../helpers/reserves';
import { supplyToReserve } from '../helpers/supplyBorrow';
import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet();

describe('Supplying Assets on Aave V4', () => {
  describe('Given a user and a reserve', () => {
    describe('When the user supplies tokens to a reserve, that support collateral', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('10'),
          decimals: 6,
        });
        assertOk(setup);
      });

      it('Then the supply position is updated and the tokens are enabled as collateral by default', async () => {
        const usdcReserve = await findReservesToSupply(client, user, {
          asCollateral: true,
          token: ETHEREUM_USDC_ADDRESS,
        });
        assertOk(usdcReserve);
        assertNonEmptyArray(usdcReserve.value);

        const amountToSupply = bigDecimal('9');
        const result = await supply(client, {
          reserve: usdcReserve.value[0].id,
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
                  spoke: usdcReserve.value[0].spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            usdcReserve.value[0].asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(true);
        expect(supplyPosition.principal.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
        );
      });
    });

    describe('When the user wants to preview the supply action before performing it', () => {
      it('Then the user can review the supply details before proceeding', async () => {
        const reserveToSupply = await findReservesToSupply(client, user, {
          token: ETHEREUM_USDC_ADDRESS,
        });
        assertOk(reserveToSupply);
        assertNonEmptyArray(reserveToSupply.value);

        const previewResult = await preview(
          client,
          {
            action: {
              supply: {
                reserve: reserveToSupply.value[0].id,
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
          riskPremium: expect.any(Object),
        });
      });
    });

    describe('When the user supplies tokens to a reserve disabling the collateral', () => {
      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_1INCH_ADDRESS,
          amount: bigDecimal('10'),
          decimals: 18,
        });
        assertOk(setup);
      });

      it('Then the supply position is updated and the tokens are disabled as collateral', async () => {
        const amountToSupply = bigDecimal('9');
        const inchReserve = await findReservesToSupply(client, user, {
          token: ETHEREUM_1INCH_ADDRESS,
        });
        assertOk(inchReserve);
        assertNonEmptyArray(inchReserve.value);
        const result = await supplyToReserve(client, user, {
          reserve: inchReserve.value[0].id,
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
                spoke: inchReserve.value[0].spoke.id,
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
            inchReserve.value[0].asset.underlying.address
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
        const result = await findReservesToSupply(client, user, {
          asCollateral: true,
        });
        assertOk(result);
        assertNonEmptyArray(result.value);
        reserveWithPermit = result.value.find(
          (reserve) => reserve.asset.underlying.permitSupported === true,
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
        );
      });
    });
  });

  describe('Given a user and a reserve that supports native token deposits', () => {
    describe('When the user wants to preview the supply action before performing it', () => {
      it('Then the user can review the supply details before proceeding', async () => {
        const amountToSupply = bigDecimal('0.01');
        const nativeReserve = await findReservesToSupply(client, user, {
          native: true,
        });
        assertOk(nativeReserve);
        assertNonEmptyArray(nativeReserve.value);

        const reservePreview = await preview(
          client,
          {
            action: {
              supply: {
                reserve: nativeReserve.value[0].id,
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
          riskPremium: expect.any(Object),
        });
      });
    });

    describe('When the user supplies native tokens with collateral disabled', () => {
      it('Then the supply position is updated and the tokens are not enabled as collateral', async () => {
        const nativeReserve = await findReservesToSupply(client, user, {
          native: true,
        });
        assertOk(nativeReserve);
        assertNonEmptyArray(nativeReserve.value);
        const result = await supplyToReserve(client, user, {
          reserve: nativeReserve.value[0].id,
          amount: {
            native: bigDecimal('0.01'),
          },
          sender: evmAddress(user.account.address),
          enableCollateral: false,
        }).andThen(() =>
          userSupplies(client, {
            query: {
              userSpoke: {
                spoke: nativeReserve.value[0].spoke.id,
                user: evmAddress(user.account.address),
              },
            },
          }),
        );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            nativeReserve.value[0].asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(false);
      });
    });

    describe('When the user supplies native tokens', () => {
      it('Then the supply position is updated and the tokens are enabled as collateral by default', async () => {
        const nativeReserve = await findReservesToSupply(client, user, {
          native: true,
        });
        assertOk(nativeReserve);
        assertNonEmptyArray(nativeReserve.value);

        const result = await supplyToReserve(client, user, {
          reserve: nativeReserve.value[0].id,
          amount: {
            native: bigDecimal('0.01'),
          },
          sender: evmAddress(user.account.address),
        }).andThen(() =>
          userSupplies(client, {
            query: {
              userSpoke: {
                spoke: nativeReserve.value[0].spoke.id,
                user: evmAddress(user.account.address),
              },
            },
          }),
        );

        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            nativeReserve.value[0].asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
      });
    });
  });
});
