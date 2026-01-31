import {
  assertOk,
  bigDecimal,
  evmAddress,
  type Reserve,
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
  ETHEREUM_USDT_ADDRESS,
} from '@aave/client/testing';
import { signTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, it } from 'vitest';
import { findReservesToBorrow } from '../helpers/reserves';
import { signApprovalsWith } from '../helpers/signApprovals';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../helpers/supplyBorrow';
import { assertSingleElementArray } from '../test-utils';

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
    });

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
      });

      describe('When the user swaps part of the borrow position to a different token using a market order', () => {
        let reserveToSwap: Reserve;

        beforeAll(async () => {
          const setup = await findReservesToBorrow(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_USDT_ADDRESS,
          });
          assertOk(setup);
          reserveToSwap = setup.value[0];
        });

        it('Then the user should be able to swap and the position should be updated', async () => {
          const result = await borrowSwapQuote(client, {
            market: {
              debtPosition: borrowedPosition.id,
              buyReserve: reserveToSwap.id,
              amount: borrowedPosition.principal.amount.value.div(2),
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
