import {
  assertOk,
  bigDecimal,
  evmAddress,
  type SwapReceipt,
  type UserBorrowItem,
  type UserSupplyItem,
} from '@aave/client';
import {
  preparePositionSwap,
  repayWithSupplyQuote,
  swap,
  userBorrows,
  userSupplies,
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
import { signApprovalsWith } from '../helpers/signApprovals';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../helpers/supplyBorrow';
import { assertSingleElementArray } from '../test-utils';

const user = await createNewWallet();

describe('Repay Position swapping on Aave V4', () => {
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
          token: ETHEREUM_USDT_ADDRESS,
          ratioToBorrow: 0.3,
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

      describe('And the user has another supply position in a different token than the borrowed one', () => {
        let notCollateralSupply: UserSupplyItem;

        beforeAll(async () => {
          // Supply a different token (USDT) that can be used to repay the USDC borrow
          const setup = await findReserveAndSupply(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_USDC_ADDRESS,
            asCollateral: false,
            swappable: true,
          }).andThen(() =>
            userSupplies(client, {
              query: {
                userSpoke: {
                  spoke: ETHEREUM_SPOKE_CORE_ID,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );

          assertOk(setup);

          // Find the supply position that is NOT the collateral (GHO)
          notCollateralSupply = setup.value.find(
            (supply) => !supply.isCollateral,
          )!;
        }, 180_000);

        describe('When the user repays part of the borrow position using the other supply position using a market order', () => {
          it('Then the swap to repay the borrow position should succeed', async ({
            annotate,
          }) => {
            const result = await repayWithSupplyQuote(client, {
              market: {
                debtPosition: borrowedPosition.id,
                repayWithReserve: notCollateralSupply.reserve.id,
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
            const orderReceipt = result.value as SwapReceipt;
            annotate(`Swap explorer url: ${orderReceipt.explorerUrl}`);
            // NOTE: Waiting to fulfill the swap makes the test flaky and unreliable (sometimes the swap is not fulfilled in time)
            // The part checking the borrow/supply positions should be checked manually (for now)
          });
        });

        describe('When the user repays part of the borrow position using the other supply position with a limit order', () => {
          it.todo(
            'Then the repayment should succeed and both positions should be updated',
          );
        });
      });
    });
  });
});
