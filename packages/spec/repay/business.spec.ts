import { assertOk, bigDecimal, evmAddress, invariant } from '@aave/client-next';
import {
  permitTypedData,
  preview,
  repay,
  userBorrows,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_SPOKE_CORE_ADDRESS,
  ETHEREUM_WSTETH_ADDRESS,
  fundErc20Address,
  getNativeBalance,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';
import {
  borrowFromReserve,
  supplyToReserve,
  supplyWSTETHAndBorrowETH,
} from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Repaying Loans on Aave V4', () => {
  describe('Given a user and a reserve with an active borrow position', () => {
    let reserve: Reserve;

    beforeEach(async () => {
      const supplySetup = await findReservesToSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
        asCollateral: true,
      }).andThen((supplyReserves) =>
        fundErc20Address(evmAddress(user.account.address), {
          address: supplyReserves[0].asset.underlying.address,
          amount: bigDecimal('0.2'),
          decimals: supplyReserves[0].asset.underlying.info.decimals,
        }).andThen(() =>
          supplyToReserve(client, user, {
            reserve: supplyReserves[0].id,
            amount: { erc20: { value: bigDecimal(0.01) } },
            sender: evmAddress(user.account.address),
            enableCollateral: true,
          }),
        ),
      );
      assertOk(supplySetup);
      const borrowSetup = await findReservesToBorrow(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ADDRESS,
      }).andThen((borrowReserves) => {
        const reserveWithPermit = borrowReserves.find(
          (reserve) => reserve.asset.underlying.permitSupported,
        );
        if (!reserveWithPermit) {
          throw new Error('No reserve with permit support found');
        }
        return borrowFromReserve(client, user, {
          sender: evmAddress(user.account.address),
          reserve: reserveWithPermit.id,
          amount: {
            erc20: {
              value:
                reserveWithPermit.userState!.borrowable.amount.value.times(0.1),
            },
          },
        }).map(() => reserveWithPermit);
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
            amount: reserve.userState!.borrowable.amount.value.times(2),
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
                    exact:
                      reserve.userState!.borrowable.amount.value.times(0.1),
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
            amount: positionBefore.debt.amount.value.times(2),
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
      it('Then the repayment is processed without requiring prior ERC20 approval', async () => {
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
        const amountToRepay = positionBefore.debt.amount.value.times(0.5);

        const signature = await permitTypedData(client, {
          repay: {
            amount: {
              exact: amountToRepay,
            },
            reserve: reserve.id,
            sender: evmAddress(user.account.address),
          },
        }).andThen(signERC20PermitWith(user));
        assertOk(signature);

        const repayResult = await repay(client, {
          reserve: reserve.id,
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              permitSig: signature.value,
              value: {
                exact: amountToRepay,
              },
            },
          },
        })
          .andTee((tx) => expect(tx.__typename).toEqual('TransactionRequest'))
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
            borrowBefore.value[0]!.reserve.asset.underlying.address
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.debt.amount.value).toBeBigDecimalCloseTo(
          amountToRepay,
        );
      });
    });
  });

  describe('Given a user and a reserve that supports repayments in native tokens', () => {
    let reserveSupportingNative: Reserve;

    beforeAll(async () => {
      const setup = await fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_WSTETH_ADDRESS,
        amount: bigDecimal('0.5'),
      }).andThen(() => supplyWSTETHAndBorrowETH(client, user));

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
        expect(repayResult.value.length).toBe(0);

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter.lt(balanceBefore)).toBe(true);
      });
    });
  });
});
