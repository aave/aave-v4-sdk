import {
  assertOk,
  bigDecimal,
  evmAddress,
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
import { beforeAll, describe, it } from 'vitest';
import { signApprovalsWith } from '../helpers/signApprovals';
import { findReserveAndSupply } from '../helpers/supplyBorrow';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

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
      it('Then the withdrawal should succeed and they should receive the desired token', async () => {
        const result = await withdrawSwapQuote(client, {
          market: {
            sellPosition: supplyPosition.id,
            buyToken: { erc20: ETHEREUM_USDT_ADDRESS },
            amount: supplyPosition.principal.amount.value.div(2),
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

    describe('When the user withdraws part of the position in a different token using a limit order', () => {
      it.todo(
        'Then the withdrawal should succeed and they should receive the desired token',
      );
    });
  });
});
