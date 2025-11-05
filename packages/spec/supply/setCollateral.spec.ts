import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import {
  preview,
  setUserSupplyAsCollateral,
  userSupplies,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToSupply } from '../helpers/reserves';
import { supplyToReserve } from '../helpers/supplyBorrow';
import { assertNonEmptyArray, assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Setting Supply as Collateral in Aave V4', () => {
  describe('Given a user with a supply position disabled as collateral', () => {
    beforeAll(async () => {
      const setup = await fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_USDC_ADDRESS,
        amount: bigDecimal('100'),
        decimals: 6,
      })
        .andThen(() =>
          findReservesToSupply(client, user, {
            token: ETHEREUM_USDC_ADDRESS,
            spoke: ETHEREUM_SPOKE_ISO_GOV_ADDRESS,
          }),
        )
        .andThen((listReserves) =>
          supplyToReserve(client, user, {
            reserve: {
              chainId: listReserves[0].chain.chainId,
              reserveId: listReserves[0].id,
              spoke: listReserves[0].spoke.address,
            },
            amount: {
              erc20: {
                value: bigDecimal('100'),
              },
            },
            sender: evmAddress(user.account.address),
            enableCollateral: false,
          }),
        );

      assertOk(setup);
    }, 60_000);

    describe('When the user sets the position as collateral', () => {
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

    describe('When the user wants to preview the set collateral action before performing it', () => {
      it('Then the user can review the set collateral details before proceeding', async () => {
        const positions = await userSupplies(client, {
          query: {
            userChains: {
              chainIds: [ETHEREUM_FORK_ID],
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(positions);
        assertSingleElementArray(positions.value);

        const previewResult = await preview(client, {
          action: {
            setUserSupplyAsCollateral: {
              reserve: {
                reserveId: positions.value[0].reserve.id,
                spoke: positions.value[0].reserve.spoke.address,
                chainId: positions.value[0].reserve.chain.chainId,
              },
              enableCollateral: !positions.value[0].isCollateral,
              sender: evmAddress(user.account.address),
            },
          },
        });
        assertOk(previewResult);
        // netBalance should be the same
        expect(
          previewResult.value.netBalance.after.value,
        ).toBeBigDecimalCloseTo(
          previewResult.value.netBalance.current.value,
          1,
        );
        if (!positions.value[0].isCollateral) {
          expect(
            previewResult.value.netCollateral.after.value,
          ).toBeBigDecimalGreaterThan(
            previewResult.value.netCollateral.current.value,
          );
        } else {
          expect(
            previewResult.value.netCollateral.after.value,
          ).toBeBigDecimalLessThan(
            previewResult.value.netCollateral.current.value,
          );
        }
      });
    });
  });
});
