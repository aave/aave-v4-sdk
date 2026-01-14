import { assertOk, evmAddress } from '@aave/client';
import {
  preview,
  setUserSuppliesAsCollateral,
  userSupplies,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
} from '@aave/client/testing';
import { sendWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';

import { findReserveAndSupply } from '../helpers/supplyBorrow';
import { assertNonEmptyArray, assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Setting Supply as Collateral on Aave V4', () => {
  describe('Given a user with a supply position as collateral', () => {
    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        asCollateral: true,
      });
      assertOk(setup);
    });

    describe('When the user disables the position as collateral', () => {
      it('Then the position should be disabled as collateral', async () => {
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
        expect(positions.value[0].isCollateral).toBe(true);

        const result = await setUserSuppliesAsCollateral(client, {
          changes: [
            {
              reserve: positions.value[0].reserve.id,
              enableCollateral: false,
            },
          ],
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
        expect(result.value[0].isCollateral).toBe(false);
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
            setUserSuppliesAsCollateral: {
              changes: [
                {
                  reserve: positions.value[0].reserve.id,
                  enableCollateral: !positions.value[0].isCollateral,
                },
              ],
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
          2,
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
