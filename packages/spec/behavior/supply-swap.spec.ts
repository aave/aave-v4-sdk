import {
  assertOk,
  bigDecimal,
  evmAddress,
  type Reserve,
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
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { signTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToSupply } from '../helpers/reserves';
import { signApprovalsWith } from '../helpers/signApprovals';
import { findReserveAndSupply } from '../helpers/supplyBorrow';
import { waitForSwap } from '../helpers/swaps';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Supply Position swapping on Aave V4', () => {
  describe('Given a user with a supply position eligible for swapping', () => {
    let supplyPosition: UserSupplyItem;

    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_USDC_ADDRESS,
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
        const result = await supplySwapQuote(client, {
          market: {
            sellPosition: supplyPosition.id,
            buyReserve: reserveToSwap.id,
            amount: supplyPosition.principal.amount.value.div(2),
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
        const swapStatus = await waitForSwap(orderReceipt.id, 2 * 60 * 1000); // 3 minutes

        expect(swapStatus.__typename).toEqual('SwapFulfilled');
        // TODO: Add assertions for the new supply position
      });
    });

    describe('When the user swaps part of the position for another asset using a limit order', () => {
      it.todo(
        'Then the swap should succeed and the position should be updated',
      );
    });
  });
});
