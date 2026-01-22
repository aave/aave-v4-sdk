import { assertOk, evmAddress, invariant, never, okAsync } from '@aave/client';
import { preview, repay, userBorrows } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
  getNativeBalance,
} from '@aave/client/testing';
import { permitWith, sendWith } from '@aave/client/viem';
import type { Reserve, UserBorrowItem } from '@aave/graphql';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { findReservesToBorrow } from '../helpers/reserves';
import {
  borrowFromReserve,
  findReserveAndSupply,
  supplyAndBorrowNativeToken,
} from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Repaying Loans on Aave V4', () => {
  describe('Given a user and a reserve with an active borrow position', () => {
    let reserve: Reserve;

    beforeEach(async () => {
      const supplySetup = await findReserveAndSupply(client, user, {
        token: ETHEREUM_USDC_ADDRESS,
        spoke: ETHEREUM_SPOKE_CORE_ID,
        asCollateral: true,
      });
      assertOk(supplySetup);

      const borrowSetup = await findReservesToBorrow(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        permitSupported: true,
      }).andThen(([borrowReserve]) => {
        return borrowFromReserve(client, user, {
          sender: evmAddress(user.account.address),
          reserve: borrowReserve.id,
          amount: {
            erc20: {
              value: borrowReserve.userState!.borrowable.amount.value.div(10),
            },
          },
        }).map(() => borrowReserve);
      });
      assertOk(borrowSetup);
      reserve = borrowSetup.value;
    }, 60_000);

    describe('When the user repays the full loan amount', () => {
      it("Then the borrow position is closed and the repayment is reflected in the user's positions", async () => {
        const fundWallet = await fundErc20Address(
          evmAddress(user.account.address),
          {
            address: reserve.asset.underlying.address,
            // We fund with more than borrowed amount because of interest accumulation
            amount: reserve.userState!.borrowable.amount.value.times(1.5),
            decimals: reserve.asset.underlying.info.decimals,
          },
        );
        assertOk(fundWallet);

        const repayResult = await repay(client, {
          reserve: reserve.id,
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              value: {
                max: true,
              },
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: reserve.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        expect(repayResult.value.length).toBe(0);
      });
    });

    describe('When the user wants to preview the repayment action before performing it', () => {
      it('Then the user can review the repayment details before proceeding', async () => {
        const previewResult = await preview(client, {
          action: {
            repay: {
              reserve: reserve.id,
              sender: evmAddress(user.account.address),
              amount: {
                erc20: {
                  value: {
                    exact: reserve.userState!.borrowable.amount.value.div(20),
                  },
                },
              },
            },
          },
        });
        assertOk(previewResult);
        expect(
          previewResult.value.healthFactor.after,
        ).toBeBigDecimalGreaterThan(previewResult.value.healthFactor.current);
        expect(
          previewResult.value.netCollateral.after.value,
        ).toBeBigDecimalCloseTo(
          previewResult.value.netCollateral.current.value,
          2,
        );
      });
    });

    describe('When the user repays a partial amount of the loan', () => {
      it('Then the borrow position is updated to reflect the reduced outstanding balance', async () => {
        const borrowBefore = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: reserve.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowBefore);
        const positionBefore = borrowBefore.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            reserve.asset.underlying.address
          );
        });
        invariant(positionBefore, 'No position found');
        const fundWallet = await fundErc20Address(
          evmAddress(user.account.address),
          {
            address: reserve.asset.underlying.address,
            amount: positionBefore.debt.amount.value,
            decimals: reserve.asset.underlying.info.decimals,
          },
        );
        assertOk(fundWallet);
        const amountToRepay = positionBefore.debt.amount.value.times(0.1);

        const repayResult = await repay(client, {
          reserve: reserve.id,
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              value: {
                exact: amountToRepay,
              },
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: reserve.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        const positionAfter = repayResult.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            reserve.asset.underlying.address
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.debt.amount.value).toBeBigDecimalCloseTo(
          positionBefore.debt.amount.value.minus(amountToRepay),
          4,
        );
      });
    });

    describe('When the user repays a partial amount of the loan using a valid permit signature', () => {
      let borrowBefore: UserBorrowItem;

      beforeAll(async () => {
        const setup = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: reserve.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        })
          .map(
            (borrows) =>
              borrows.find(
                (position) =>
                  position.reserve.asset.underlying.address ===
                  reserve.asset.underlying.address,
              ) ?? never('No borrow position found'),
          )
          .andThen((borrow) => {
            borrowBefore = borrow;
            return fundErc20Address(evmAddress(user.account.address), {
              address: reserve.asset.underlying.address,
              amount: borrowBefore.debt.amount.value, // overfund
              decimals: reserve.asset.underlying.info.decimals,
            });
          });
        assertOk(setup);
      });

      it('Then the repayment is processed without requiring prior ERC20 approval', async () => {
        const amountToRepay = borrowBefore.debt.amount.value.div(2);

        const repayResult = await permitWith(user, (permitSig) =>
          repay(client, {
            reserve: reserve.id,
            sender: evmAddress(user.account.address),
            amount: {
              erc20: {
                permitSig,
                value: {
                  exact: amountToRepay,
                },
              },
            },
          }),
        )
          .andThen((tx) => {
            invariant(
              tx.__typename === 'TransactionRequest',
              `Transaction request expected and got: ${tx.__typename}`,
            );
            return okAsync(tx);
          })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction);

        assertOk(repayResult);
        const after = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: reserve.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        }).map(
          (borrows) =>
            borrows.find(({ id }) => id === borrowBefore.id) ??
            never('No borrow position found'),
        );
        assertOk(after);
        expect(after.value.debt.amount.value).toBeBigDecimalCloseTo(
          borrowBefore.debt.amount.value.minus(amountToRepay),
          2,
        );
      });
    });
  });

  describe('Given a user and a reserve that supports repayments in native tokens', () => {
    let reserveSupportingNative: Reserve;

    beforeAll(async () => {
      const setup = await supplyAndBorrowNativeToken(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        ratioToBorrow: 0.4,
      });

      assertOk(setup);
      reserveSupportingNative = setup.value.borrowReserve;
    }, 60_000);

    describe('When the user repays a partial amount of the loan in native tokens', () => {
      it('Then the borrow position is updated to reflect the reduced outstanding balance', async () => {
        const borrowBefore = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: reserveSupportingNative.spoke.id,
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowBefore);
        const positionBefore = borrowBefore.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            reserveSupportingNative.asset.underlying.address
          );
        });
        invariant(positionBefore, 'No position found');
        const amountToRepay = positionBefore.debt.amount.value.times(0.5);

        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        const repayResult = await repay(client, {
          reserve: reserveSupportingNative.id,
          sender: evmAddress(user.account.address),
          amount: {
            native: {
              exact: amountToRepay,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: reserveSupportingNative.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        const positionAfter = repayResult.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            borrowBefore.value[0]!.reserve.asset.underlying.address
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.debt.amount.value).toBeBigDecimalCloseTo(
          amountToRepay,
          2,
        );

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeBigDecimalCloseTo(
          balanceBefore.minus(amountToRepay),
          4,
        );
      });
    });

    describe('When the user repays the full loan amount in native tokens', () => {
      it("Then the borrow position is closed and the repayment is reflected in the user's positions", async () => {
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        const repayResult = await repay(client, {
          reserve: reserveSupportingNative.id,
          sender: evmAddress(user.account.address),
          amount: {
            native: {
              max: true,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: reserveSupportingNative.spoke.id,
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        if (repayResult.value.length > 0) {
          // check position is closed, in case other tests failed
          const position = repayResult.value.find((position) => {
            return (
              position.reserve.asset.underlying.address ===
              reserveSupportingNative.asset.underlying.address
            );
          });
          expect(position).toBeUndefined();
        }

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter.lt(balanceBefore)).toBe(true);
      });
    });
  });
});
