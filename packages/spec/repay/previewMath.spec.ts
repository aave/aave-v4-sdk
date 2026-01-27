import {
  assertOk,
  type BigDecimal,
  bigDecimal,
  evmAddress,
  type PreviewUserPosition,
  type Reserve,
} from '@aave/client';
import { preview, userBorrows } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_WETH_ADDRESS,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Repay Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    describe('And the collateral has collateralRisk > 0', () => {
      beforeAll(async () => {
        const setup = await findReserveAndSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_AAVE_ADDRESS,
          asCollateral: true,
        });
        assertOk(setup);
      });
      describe('And the user has 1 borrow position', () => {
        let borrowReserve: { reserve: Reserve; amountBorrowed: BigDecimal };

        beforeAll(async () => {
          const borrowResult = await borrowFromRandomReserve(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            token: ETHEREUM_WETH_ADDRESS,
            ratioToBorrow: 0.2,
          });
          assertOk(borrowResult);
          borrowReserve = borrowResult.value;
        });

        describe('When the user previews a repay action repaying part of the debt', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const previewResult = await preview(client, {
              action: {
                repay: {
                  reserve: borrowReserve.reserve.id,
                  amount: {
                    erc20: {
                      value: { exact: borrowReserve.amountBorrowed.times(0.5) },
                    },
                  },
                  sender: evmAddress(user.account.address),
                },
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });

          it('Then the healthFactor should increase', () => {
            expect(previewInfo.healthFactor.after).toBeBigDecimalGreaterThan(
              previewInfo.healthFactor.current!,
            );
          });
          it('Then the riskPremium should remain unchanged', () => {
            expect(previewInfo.riskPremium.current.value).toBeBigDecimalCloseTo(
              previewInfo.riskPremium.after.value,
              { precision: 4 },
            );
          });
        });

        describe('When the user previews a repay action repaying the full debt', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const previewResult = await preview(client, {
              action: {
                repay: {
                  reserve: borrowReserve.reserve.id,
                  amount: {
                    erc20: {
                      value: { max: true },
                    },
                  },
                  sender: evmAddress(user.account.address),
                },
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });
          it('Then the healthFactor should become null', () => {
            expect(previewInfo.healthFactor.after).toBeNull();
          });

          it('Then the riskPremium should be 0', () => {
            expect(previewInfo.riskPremium.after.value).toBe(bigDecimal(0));
          });
        });
      });

      describe('And the user has 2 borrow positions', () => {
        let borrowReserveToRepay: Reserve;

        beforeAll(async () => {
          // Check if the user has 1 borrow position
          const borrows = await userBorrows(client, {
            query: {
              userSpoke: {
                spoke: ETHEREUM_SPOKE_CORE_ID,
                user: evmAddress(user.account.address),
              },
            },
          });
          assertOk(borrows);

          // If the test is run in isolation, the user need to create two borrow positions
          if (borrows.value.length === 0) {
            const borrowResult = await borrowFromRandomReserve(client, user, {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              token: ETHEREUM_WETH_ADDRESS,
              ratioToBorrow: 0.2,
            });
            assertOk(borrowResult);
          }

          const secondBorrowResult = await borrowFromRandomReserve(
            client,
            user,
            {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              token: ETHEREUM_GHO_ADDRESS,
              ratioToBorrow: 0.2,
            },
          );
          assertOk(secondBorrowResult);
          borrowReserveToRepay = secondBorrowResult.value.reserve;
        });

        describe('When the user previews a repay action repaying one of the borrow positions', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const previewResult = await preview(client, {
              action: {
                repay: {
                  reserve: borrowReserveToRepay.id,
                  amount: { erc20: { value: { max: true } } },
                  sender: evmAddress(user.account.address),
                },
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });

          it('Then the healthFactor should increase', () => {
            expect(previewInfo.healthFactor.after).toBeBigDecimalGreaterThan(
              previewInfo.healthFactor.current,
            );
          });

          it('Then the riskPremium should remain unchanged', () => {
            expect(previewInfo.riskPremium.current.value).toBeBigDecimalCloseTo(
              previewInfo.riskPremium.after.value,
              { precision: 4 },
            );
          });
        });
      });
    });
  });
});
