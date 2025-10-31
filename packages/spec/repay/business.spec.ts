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
  ETHEREUM_TOKENS,
  fundErc20Address,
  getNativeBalance,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  supplyAndBorrow,
  supplyWSTETHAndBorrowETH,
} from '../helpers/borrowSupply';
import {
  findReservesToBorrow,
  findReservesToSupply,
} from '../helpers/reserves';

const user = await createNewWallet();

describe('Repaying Loans on Aave V4', () => {
  describe('Given a user and a reserve with an active borrow position', () => {
    let borrowReserve: Reserve;

    beforeEach(async () => {
      const result = await findReservesToBorrow(client, user);
      assertOk(result);
      const usdcOrUsdsReserve = result.value.find(
        (reserve) =>
          reserve.asset.underlying.address === ETHEREUM_TOKENS.USDC ||
          reserve.asset.underlying.address === ETHEREUM_TOKENS.USDS,
      );
      invariant(usdcOrUsdsReserve, 'No USDC or USDS reserve found');
      borrowReserve = usdcOrUsdsReserve;

      const setup = await findReservesToSupply(client, user, {
        spoke: borrowReserve.spoke.address,
        asCollateral: true,
      }).andThen((reserves) => {
        return fundErc20Address(evmAddress(user.account.address), {
          address: reserves.find(
            (reserve) => reserve.asset.underlying.permitSupported === true,
          )!.asset.underlying.address,
          amount: bigDecimal('1'),
          decimals: reserves.find(
            (reserve) => reserve.asset.underlying.permitSupported === true,
          )!.asset.underlying.info.decimals,
        })
          .andThen(() =>
            fundErc20Address(evmAddress(user.account.address), {
              address: borrowReserve.asset.underlying.address,
              amount: bigDecimal('1000'),
              decimals: borrowReserve.asset.underlying.info.decimals,
            }),
          )
          .andThen(() =>
            supplyAndBorrow(client, user, {
              supplyReserve: reserves.find(
                (reserve) => reserve.asset.underlying.permitSupported === true,
              )!,
              borrowReserve: borrowReserve,
              amountToSupply: bigDecimal('1'),
            }),
          );
      });

      assertOk(setup);
    }, 60_000);

    describe('When the user repays the full loan amount', () => {
      it("Then the borrow position is closed and the repayment is reflected in the user's positions", async () => {
        const repayResult = await repay(client, {
          reserve: {
            spoke: borrowReserve.spoke.address,
            reserveId: borrowReserve.id,
            chainId: borrowReserve.chain.chainId,
          },
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
                  spoke: {
                    address: borrowReserve.spoke.address,
                    chainId: borrowReserve.chain.chainId,
                  },
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
        const borrowBefore = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: borrowReserve.spoke.address,
                chainId: borrowReserve.chain.chainId,
              },
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowBefore);
        const positionBefore = borrowBefore.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            borrowReserve.asset.underlying.address
          );
        });
        invariant(positionBefore, 'No position found');
        const amountBorrowed = Number(positionBefore.debt.amount.value);
        const previewResult = await preview(client, {
          action: {
            repay: {
              reserve: {
                reserveId: borrowReserve.id,
                chainId: borrowReserve.chain.chainId,
                spoke: borrowReserve.spoke.address,
              },
              sender: evmAddress(user.account.address),
              amount: {
                erc20: {
                  value: {
                    exact: bigDecimal(amountBorrowed / 3),
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
              spoke: {
                address: borrowReserve.spoke.address,
                chainId: borrowReserve.chain.chainId,
              },
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowBefore);
        const positionBefore = borrowBefore.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            borrowReserve.asset.underlying.address
          );
        });
        invariant(positionBefore, 'No position found');
        const amountBorrowed = Number(positionBefore.debt.amount.value);
        const amountToRepay = amountBorrowed / 3;

        const repayResult = await repay(client, {
          reserve: {
            spoke: borrowReserve.spoke.address,
            reserveId: borrowReserve.id,
            chainId: borrowReserve.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            erc20: {
              value: {
                exact: bigDecimal(amountToRepay),
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
                  spoke: {
                    address: borrowReserve.spoke.address,
                    chainId: borrowReserve.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        const positionAfter = repayResult.value.find((position) => {
          return (
            position.reserve.asset.underlying.address ===
            borrowReserve.asset.underlying.address
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.debt.amount.value).toBeBigDecimalCloseTo(
          amountBorrowed - amountToRepay,
          2,
        );
      });

      describe('When the user repays a partial amount of the loan using a valid permit signature', () => {
        it('Then the repayment is processed without requiring prior ERC20 approval', async () => {
          const borrowBefore = await userBorrows(client, {
            query: {
              userSpoke: {
                spoke: {
                  address: borrowReserve.spoke.address,
                  chainId: borrowReserve.chain.chainId,
                },
                user: evmAddress(user.account.address),
              },
            },
          });
          assertOk(borrowBefore);
          const positionBefore = borrowBefore.value.find((position) => {
            return (
              position.reserve.asset.underlying.address ===
              borrowReserve.asset.underlying.address
            );
          });
          invariant(positionBefore, 'No position found');
          const amountBorrowed = Number(positionBefore.debt.amount.value);
          const amountToRepay = amountBorrowed / 3;

          const signature = await permitTypedData(client, {
            repay: {
              amount: {
                exact: bigDecimal(amountToRepay),
              },
              reserve: {
                reserveId: borrowReserve.id,
                chainId: borrowReserve.chain.chainId,
                spoke: borrowReserve.spoke.address,
              },
              sender: evmAddress(user.account.address),
            },
          }).andThen(signERC20PermitWith(user));
          assertOk(signature);

          const repayResult = await repay(client, {
            reserve: {
              spoke: borrowReserve.spoke.address,
              reserveId: borrowReserve.id,
              chainId: borrowReserve.chain.chainId,
            },
            sender: evmAddress(user.account.address),
            amount: {
              erc20: {
                permitSig: signature.value,
                value: {
                  exact: bigDecimal(amountToRepay),
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
                    spoke: {
                      address: borrowReserve.spoke.address,
                      chainId: borrowReserve.chain.chainId,
                    },
                    user: evmAddress(user.account.address),
                  },
                },
              }),
            );
          assertOk(repayResult);
          const positionAfter = repayResult.value.find((position) => {
            return (
              position.reserve.asset.underlying.address ===
              borrowReserve.asset.underlying.address
            );
          });
          invariant(positionAfter, 'No position found');
          expect(positionAfter.debt.amount.value).toBeBigDecimalCloseTo(
            amountBorrowed - amountToRepay,
            2,
          );
        });
      });
    });
  });

  describe('Given a user and a reserve that supports repayments in native tokens', () => {
    let reserve: Reserve;

    beforeAll(async () => {
      const setup = await fundErc20Address(evmAddress(user.account.address), {
        address: ETHEREUM_TOKENS.wstETH,
        amount: bigDecimal('0.5'),
      }).andThen(() => supplyWSTETHAndBorrowETH(client, user));

      assertOk(setup);
      reserve = setup.value.borrowReserve;
    }, 60_000);

    describe('When the user repays a partial amount of the loan in native tokens', () => {
      it('Then the borrow position is updated to reflect the reduced outstanding balance', async () => {
        const borrowBefore = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: reserve.spoke.address,
                chainId: reserve.chain.chainId,
              },
              user: evmAddress(user.account.address),
            },
          },
        });
        assertOk(borrowBefore);
        const positionBefore = borrowBefore.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_TOKENS.WETH
          );
        });
        invariant(positionBefore, 'No position found');
        const amountBorrowed = Number(positionBefore.debt.amount.value);
        const amountToRepay = amountBorrowed / 2;

        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account.address),
          amount: {
            native: {
              exact: bigDecimal(amountToRepay),
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
                  },
                  user: evmAddress(user.account.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        const positionAfter = repayResult.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_TOKENS.WETH
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.debt.amount.value).toBeBigDecimalCloseTo(
          amountBorrowed - amountToRepay,
          2,
        );

        const balanceAfter = await getNativeBalance(
          evmAddress(user.account.address),
        );
        expect(balanceAfter).toBeCloseTo(balanceBefore - amountToRepay, 4);
      });
    });

    describe('When the user repays the full loan amount in native tokens', () => {
      it("Then the borrow position is closed and the repayment is reflected in the user's positions", async () => {
        const balanceBefore = await getNativeBalance(
          evmAddress(user.account.address),
        );

        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
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
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
                  },
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
        expect(balanceAfter).toBeLessThan(balanceBefore);
      });
    });
  });
});
