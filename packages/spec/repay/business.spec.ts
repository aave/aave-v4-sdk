import { assertOk, bigDecimal, evmAddress, invariant } from '@aave/client-next';
import { permitTypedData, repay, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_GHO_ADDRESS,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith, signERC20PermitWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { supplyWETHAndBorrowMax } from './helper';

const user = await createNewWallet();

describe('Aave V4 Repay Scenario', () => {
  describe('Given a user with a borrow position', () => {
    describe('When the user repays their loan', () => {
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WETH_ADDRESS,
          amount: bigDecimal('1.0'),
        })
          .andThen(() =>
            fundErc20Address(evmAddress(user.account.address), {
              address: ETHEREUM_USDC_ADDRESS,
              amount: bigDecimal('300'),
              decimals: 6,
            }),
          )
          .andThen(() =>
            supplyWETHAndBorrowMax(client, user, ETHEREUM_USDC_ADDRESS),
          );

        assertOk(setup);
        reserve = setup.value.borrowReserve;
      });
      // TODO: Enable when bug is fixed
      it.skip('Then it should be reflected in the user positions', async () => {
        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
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
      });
    });

    describe('When the user repays a partial amount of their loan', () => {
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_USDC_ADDRESS,
          amount: bigDecimal('300'),
          decimals: 6,
        })
          .andThen(() =>
            fundErc20Address(evmAddress(user.account.address), {
              address: ETHEREUM_WETH_ADDRESS,
              amount: bigDecimal('1.0'),
            }),
          )
          .andThen(() =>
            supplyWETHAndBorrowMax(client, user, ETHEREUM_USDC_ADDRESS),
          );

        assertOk(setup);
        reserve = setup.value.borrowReserve;
      });

      it('Then it should be reflected in the user positions', async () => {
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
            position.reserve.asset.underlying.address === ETHEREUM_USDC_ADDRESS
          );
        });
        invariant(positionBefore, 'No position found');
        const amountBorrowed = Number(positionBefore.amount.value.formatted);
        const amountToRepay = amountBorrowed / 2;

        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
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
            position.reserve.asset.underlying.address === ETHEREUM_USDC_ADDRESS
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.amount.value.formatted).toBeBigDecimalCloseTo(
          amountToRepay,
          2,
        );
      });
    });

    describe('When the user repays a loan with a permit signature', () => {
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(evmAddress(user.account.address), {
          address: ETHEREUM_WETH_ADDRESS,
          amount: bigDecimal('1.0'),
        })
          .andThen(() =>
            fundErc20Address(evmAddress(user.account.address), {
              address: ETHEREUM_GHO_ADDRESS,
              amount: bigDecimal('300'),
            }),
          )
          .andThen(() =>
            supplyWETHAndBorrowMax(client, user, ETHEREUM_GHO_ADDRESS),
          );

        assertOk(setup);
        reserve = setup.value.borrowReserve;
      });

      it('Then it should allow to repay their own loan without needing for an ERC20 Approval transaction', async ({
        annotate,
      }) => {
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
            position.reserve.asset.underlying.address === ETHEREUM_GHO_ADDRESS
          );
        });
        invariant(positionBefore, 'No position found');
        const amountBorrowed = Number(positionBefore.amount.value.formatted);
        const amountToRepay = amountBorrowed / 2;

        const signature = await permitTypedData(client, {
          repay: {
            amount: {
              exact: bigDecimal(amountToRepay),
            },
            reserve: {
              reserveId: reserve.id,
              chainId: reserve.chain.chainId,
              spoke: reserve.spoke.address,
            },
            sender: evmAddress(user.account!.address),
          },
        }).andThen(signERC20PermitWith(user));
        assertOk(signature);

        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account!.address),
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
          .andTee((tx) => annotate(`tx hash: ${tx.txHash}`))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userBorrows(client, {
              query: {
                userSpoke: {
                  spoke: {
                    address: reserve.spoke.address,
                    chainId: reserve.chain.chainId,
                  },
                  user: evmAddress(user.account!.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        const positionAfter = repayResult.value.find((position) => {
          return (
            position.reserve.asset.underlying.address === ETHEREUM_GHO_ADDRESS
          );
        });
        invariant(positionAfter, 'No position found');
        expect(positionAfter.amount.value.formatted).toBeBigDecimalCloseTo(
          amountToRepay,
          2,
        );
      });
    });
  });
});
