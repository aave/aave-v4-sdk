import {
  assertOk,
  evmAddress,
  type SwapReceipt,
  type UserSupplyItem,
} from '@aave/client';
import {
  preparePositionSwap,
  swap,
  userSupplies,
  withdrawSwapQuote,
} from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDT_ADDRESS,
} from '@aave/client/testing';
import { signTypedDataWith } from '@aave/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';
import { signApprovalsWith } from '../helpers/signApprovals';
import { findReserveAndSupply } from '../helpers/supplyBorrow';
import { waitForSwap } from '../helpers/swaps';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

// TODO: Enable when contracts are deployed
describe('Withdraw Position swapping on Aave V4', () => {
  describe('Given a user with a supply position', () => {
    let supplyPosition: UserSupplyItem;

    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_USDC_ADDRESS,
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

    describe('When the user withdraws part of the position in a different token using a market order', () => {
      it('Then the withdrawal should succeed and they should receive the desired token', async ({
        annotate,
      }) => {
        const result = await withdrawSwapQuote(client, {
          market: {
            sellPosition: supplyPosition.id,
            buyToken: { erc20: ETHEREUM_USDT_ADDRESS },
            amount: supplyPosition.principal.amount.value.div(2),
            user: evmAddress(user.account.address),
            // selectedSlippage: bigDecimal('50'), // TODO: Add slippage when fixed the bug
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
        // TODO: Add assertions for the new supply position
      });
    });

    describe('When the user withdraws part of the position in a different token using a limit order', () => {
      it.todo(
        'Then the withdrawal should succeed and they should receive the desired token',
      );
    });
  });
});
