import {
  assertOk,
  bigDecimal,
  evmAddress,
  type Reserve,
  type SwapReceipt,
  type UserBorrowItem,
} from '@aave/client';
import {
  borrowSwapQuote,
  preparePositionSwap,
  swap,
  userBorrows,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { signTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToBorrow } from '../helpers/reserves';
import { signApprovalsWith } from '../helpers/signApprovals';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../helpers/supplyBorrow';
import { waitForSwap } from '../helpers/swaps';
import { assertNonEmptyArray, assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Borrow Position swapping on Aave V4', () => {
  describe('Given a user with a supply position enabled as collateral', () => {
    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_GHO_ADDRESS,
        asCollateral: true,
      });
      assertOk(setup);
    }, 180_000);

    describe('And the user has a borrow position', () => {
      let borrowedPosition: UserBorrowItem;

      beforeAll(async () => {
        const setup = await borrowFromRandomReserve(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_USDC_ADDRESS,
          ratioToBorrow: 0.5,
        }).andThen((info) =>
          userBorrows(client, {
            query: {
              userSpoke: {
                spoke: info.reserve.spoke.id,
                user: evmAddress(user.account.address),
              },
            },
          }),
        );

        assertOk(setup);
        assertSingleElementArray(setup.value);
        borrowedPosition = setup.value[0];
      }, 180_000);

      describe('When the user swaps part of the borrow position to a different token using a market order', () => {
        let reserveToSwap: Reserve;

        beforeAll(async () => {
          const setup = await findReservesToBorrow(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
          });
          assertOk(setup);
          assertNonEmptyArray(setup.value);
          const reservesToSwap = setup.value;

          // Find a reserve with liquidity to swap into
          for (const reserve of reservesToSwap) {
            const result = await borrowSwapQuote(client, {
              market: {
                debtPosition: borrowedPosition.id,
                buyReserve: reserve.id,
                amount: borrowedPosition.principal.amount.value.div(2),
                user: evmAddress(user.account.address),
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
        }, 180_000);

        it('Then the user should be able to swap and the position should be updated', async ({
          annotate,
        }) => {
          const result = await borrowSwapQuote(client, {
            market: {
              debtPosition: borrowedPosition.id,
              buyReserve: reserveToSwap.id,
              amount: borrowedPosition.principal.amount.value.div(10),
              user: evmAddress(user.account.address),
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
          const swapStatus = await waitForSwap(orderReceipt.id, 2 * 60 * 1000); // 2 minutes
          expect(swapStatus.__typename).toEqual('SwapFulfilled');
          // TODO: Add assertions for the new borrow position
        });
      });

      describe('When the user swaps part of the borrow position to a different token using a limit order', () => {
        it.todo(
          'Then the swap should succeed and the position should be updated',
        );
      });
    });
  });
});
