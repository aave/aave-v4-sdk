import {
  assertOk,
  bigDecimal,
  evmAddress,
  type Reserve,
  type SupplySwap,
  type SwapReceipt,
  type UserSupplyItem,
} from '@aave/client';
import {
  preparePositionSwap,
  supplySwapQuote,
  swap,
  userSupplies,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDT_ADDRESS,
} from '@aave/client/testing';
import { signTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToSupply } from '../helpers/reserves';
import { signApprovalsWith } from '../helpers/signApprovals';
import { findReserveAndSupply } from '../helpers/supplyBorrow';
import {
  availableSwappableTokens,
  waitForSwapToFulfill,
} from '../helpers/swaps';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Supply Position swapping on Aave V4', () => {
  describe('Given a user with a supply position eligible for swapping', () => {
    let supplyPosition: UserSupplyItem;

    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_USDT_ADDRESS,
        swappable: true,
      }).andThen((reserve) =>
        userSupplies(client, {
          query: {
            userSpoke: {
              spoke: reserve.reserveInfo.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        }),
      );

      assertOk(setup);
      assertSingleElementArray(setup.value);
      supplyPosition = setup.value[0];
    });
    describe('When the user swaps part of the position for another asset using a market order', () => {
      let reserveToSwap: Reserve;

      beforeAll(async () => {
        const setup = await findReservesToSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
        });
        assertOk(setup);
        const reservesToSwap = setup.value.filter(
          (reserve) =>
            availableSwappableTokens.includes(
              reserve.asset.underlying.address,
            ) &&
            reserve.asset.underlying.address !==
              supplyPosition.reserve.asset.underlying.address,
        );

        // Find a reserve with liquidity to swap into
        for (const reserve of reservesToSwap) {
          const result = await supplySwapQuote(client, {
            market: {
              sellPosition: supplyPosition.id,
              buyReserve: reserve.id,
              amount: supplyPosition.principal.amount.value.div(2),
              user: evmAddress(user.account.address),
              enableCollateral: false,
            },
          });
          if (result.isOk()) {
            reserveToSwap = reserve;
            break;
          }
        }

        if (!reserveToSwap) {
          throw new Error('No reserve to swap found');
        }
      });

      it('Then the swap should succeed and the position should be updated', async ({
        annotate,
      }) => {
        const amountToSell = supplyPosition.principal.amount.value.div(2);
        const result = await supplySwapQuote(client, {
          market: {
            sellPosition: supplyPosition.id,
            buyReserve: reserveToSwap.id,
            amount: amountToSell,
            user: evmAddress(user.account.address),
            enableCollateral: false,
            selectedSlippage: bigDecimal('50'),
          },
        })
          .andThen(signApprovalsWith(user))
          .andThen((request) => preparePositionSwap(client, request))
          .andThen(({ newQuoteId, data }) =>
            signTypedDataWith(user, data).andThen((signature) =>
              swap(client, { intent: { quoteId: newQuoteId, signature } }),
            ),
          );
        assertOk(result);

        const orderReceipt = result.value as SwapReceipt;
        annotate(`Swap explorer url: ${orderReceipt.explorerUrl}`);
        const swapStatus = await waitForSwapToFulfill(
          orderReceipt.id,
          3 * 60 * 1000,
        ); // 3 minutes

        const suppliesResult = await userSupplies(client, {
          query: {
            userSpoke: {
              spoke: reserveToSwap.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(suppliesResult);

        // Check the updated supply position
        const updatedPosition = suppliesResult.value.find(
          (pos) => pos.id === supplyPosition.id,
        );
        expect(updatedPosition).not.toBeUndefined();
        expect(updatedPosition!.principal.amount.value).toBeBigDecimalCloseTo(
          supplyPosition.principal.amount.value.minus(amountToSell),
          { precision: 2 },
        );

        // Check the updated supply position
        const newPosition = suppliesResult.value.find(
          (pos) => pos.reserve.id === reserveToSwap.id,
        );
        expect(newPosition).not.toBeUndefined();
        // NOTE: We don't know the exact amount of the new position
        // because the swap is done at market price, so the amount is not guaranteed but at least greater than the bought amount.
        expect(newPosition!.principal.amount.value).toBeBigDecimalGreaterThan(
          (swapStatus.operation as SupplySwap).buyPosition.amount.amount.value,
        );
      });
    });

    describe('When the user swaps part of the position for another asset using a limit order', () => {
      it.todo(
        'Then the swap should succeed and the position should be updated',
      );
    });
  });
});
