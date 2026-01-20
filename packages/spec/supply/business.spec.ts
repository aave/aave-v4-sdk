import {
  assertOk,
  bigDecimal,
  Currency,
  evmAddress,
  invariant,
  never,
  okAsync,
  type Reserve,
} from '@aave/client';
import { preview, supply, userSupplies } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_1INCH_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client/testing';
import { permitWith, sendWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToSupply } from '../helpers/reserves';
import { supplyToReserve } from '../helpers/supplyBorrow';
import { assertNonEmptyArray } from '../test-utils';

const user = await createNewWallet();

describe('Supplying Assets on Aave V4', () => {
  describe('Given a user and a reserve, that supports collateral', () => {
    describe('When the user supplies tokens to a reserve', () => {
      let usdcReserveSupplied: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('10'),
          decimals: 6,
        }).andThen(() =>
          findReservesToSupply(client, user, {
            token: ETHEREUM_USDC_ADDRESS,
            canUseAsCollateral: true,
          }),
        );
        assertOk(setup);
        assertNonEmptyArray(setup.value);
        usdcReserveSupplied = setup.value[0];
      });

      it('Then the supply position is updated and the tokens are NOT enabled as collateral', async () => {
        const amountToSupply = bigDecimal('9');

        const result = await supply(client, {
          reserve: usdcReserveSupplied.id,
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
                  spoke: usdcReserveSupplied.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(result);

        const supplyPosition = result.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            usdcReserveSupplied.asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(false);
        expect(supplyPosition.principal.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
          2,
        );
      });
    });

    describe('When the user supplies tokens enabling collateral', () => {
      let reserveNotCollateral: Reserve;

      beforeAll(async () => {
        const setup = await findReservesToSupply(client, user, {
          token: ETHEREUM_1INCH_ADDRESS,
          canUseAsCollateral: true,
        }).andThen((reserves) => {
          reserveNotCollateral = reserves[0];
          return fundErc20Address(evmAddress(user.account.address), {
            address: reserveNotCollateral.asset.underlying.address,
            amount: bigDecimal('1'),
            decimals: reserveNotCollateral.asset.underlying.info.decimals,
          });
        });

        assertOk(setup);
      });

      it('Then the supply position is updated and the tokens are enabled as collateral', async () => {
        const amountToSupply = bigDecimal('1');

        const result = await supplyToReserve(client, user, {
          reserve: reserveNotCollateral.id,
          amount: {
            erc20: {
              value: amountToSupply,
            },
          },
          sender: evmAddress(user.account.address),
          enableCollateral: true,
        }).andThen(() =>
          userSupplies(client, {
            query: {
              userSpoke: {
                spoke: reserveNotCollateral.spoke.id,
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
            reserveNotCollateral.asset.underlying.address
          );
        });
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(true);
        expect(supplyPosition.withdrawable.amount.value).toBeBigDecimalCloseTo(
          amountToSupply,
          3,
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
          borrowingPower: expect.any(Object),
          netBalance: expect.any(Object),
          netCollateral: expect.any(Object),
          netApy: expect.any(Object),
          riskPremium: expect.any(Object),
          otherConditions: expect.any(Array),
          projectedEarnings: expect.any(Object),
        });
      });
    });

    describe('When the user supplies tokens using a valid permit signature', () => {
      let reserveWithPermit: Reserve;

      beforeAll(async () => {
        const setup = await findReservesToSupply(client, user)
          .map(
            (reserves) =>
              reserves.find(
                (reserve) => reserve.asset.underlying.permitSupported === true,
              ) ?? never('No permit supported reserve found'),
          )
          .andThen((reserve) => {
            reserveWithPermit = reserve;
            return fundErc20Address(evmAddress(user.account.address), {
              address: reserve.asset.underlying.address,
              amount: bigDecimal('10'),
              decimals: reserve.asset.underlying.info.decimals,
            });
          });
        assertOk(setup);
      });

      it('Then the supply is processed without requiring prior ERC20 approval', async () => {
        const amountToSupply = bigDecimal('0.9');

        const result = await permitWith(user, (permitSig) =>
          supply(client, {
            reserve: reserveWithPermit.id,
            amount: {
              erc20: {
                value: amountToSupply,
                permitSig,
              },
            },
            sender: evmAddress(user.account.address),
          }),
        )
          .andThen((tx) => {
            invariant(
              tx.__typename === 'TransactionRequest',
              `Transaction request expected and got: ${tx.__typename}`,
            );
            return okAsync(tx);
          })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction);

        assertOk(result);
      });
    });
  });

  // TODO: Enable when we have a test fork that allow us to control
  describe.skip('Given a user and a reserve that supports native token deposits', () => {
    describe('When the user supplies native tokens to a reserve but they do NOT enable the supply as collateral', () => {
      it('Then the supply position is updated and the tokens are not enabled as collateral', async () => {
        const nativeReserve = await findReservesToSupply(client, user, {
          native: true,
          canUseAsCollateral: true,
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
        expect(supplyPosition.isCollateral).toEqual(false);
      });
    });

    describe('When the user supplies native tokens enabling as collateral', () => {
      it('Then the supply position is updated and the tokens are enabled as collateral by default', async () => {
        const nativeReserve = await findReservesToSupply(client, user, {
          native: true,
          canUseAsCollateral: true,
        });
        assertOk(nativeReserve);
        assertNonEmptyArray(nativeReserve.value);

        const result = await supplyToReserve(client, user, {
          reserve: nativeReserve.value[0].id,
          amount: {
            native: bigDecimal('0.01'),
          },
          sender: evmAddress(user.account.address),
          enableCollateral: true,
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

        const supplyPosition = result.value.find(
          (position) =>
            position.reserve.asset.underlying.address ===
            nativeReserve.value[0].asset.underlying.address,
        );
        invariant(supplyPosition, 'No supply position found');
        expect(supplyPosition.isCollateral).toEqual(true);
      });
    });
  });
});
