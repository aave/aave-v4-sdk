import { assertOk, bigDecimal, evmAddress } from '@aave/client-next';
import { repay, userBorrows } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { supplyAndBorrow } from './helper';

describe('Aave V4 Repay Scenario', () => {
  describe('Given a user with a borrow position', () => {
    describe('When the user repays their loan', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          ETHEREUM_USDC_ADDRESS,
          evmAddress(user.account!.address),
          bigDecimal('200'),
          6,
        ).andThen(() => supplyAndBorrow(client, user, ETHEREUM_USDC_ADDRESS));

        assertOk(setup);
        reserve = setup.value;

        // Make sure the borrow position is created
        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: reserve.spoke.address,
                chainId: reserve.chain.chainId,
              },
              user: evmAddress(user.account!.address),
            },
          },
        });
        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(1);
      });

      // TODO: Enable when bug is fixed
      it.skip('Then it should be reflected in the user positions', async () => {
        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account!.address),
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
                  user: evmAddress(user.account!.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        expect(repayResult.value.length).toBe(0);
      });
    });

    describe('When the user repays a partial amount of their loan', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          ETHEREUM_USDC_ADDRESS,
          evmAddress(user.account!.address),
          bigDecimal('200'),
          6,
        ).andThen(() => supplyAndBorrow(client, user, ETHEREUM_USDC_ADDRESS));

        assertOk(setup);
        reserve = setup.value;

        // Make sure the borrow position is created
        const borrowPositions = await userBorrows(client, {
          query: {
            userSpoke: {
              spoke: {
                address: reserve.spoke.address,
                chainId: reserve.chain.chainId,
              },
              user: evmAddress(user.account!.address),
            },
          },
        });
        assertOk(borrowPositions);
        expect(borrowPositions.value.length).toBe(1);
      });

      it('Then it should be reflected in the user positions', async () => {
        const repayResult = await repay(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account!.address),
          amount: {
            erc20: {
              value: {
                exact: bigDecimal('25'),
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
                  user: evmAddress(user.account!.address),
                },
              },
            }),
          );
        assertOk(repayResult);
        expect(repayResult.value.length).toBe(1);
        expect(
          Number(repayResult.value[0]!.amount.value.formatted),
        ).toBeCloseTo(Number(bigDecimal('25')), 3);
        // TODO: Enable when fix with amounts are fixed
        // expect(repayResult.value[0]!.amount.value).toMatchSnapshot();
      });
    });

    describe('When the user repays a loan with a permit signature', () => {
      it.todo(
        'Then it should allow to repay their own loan without needing for an ERC20 Approval transaction',
      );
    });
  });

  describe('Given an open borrow position', () => {
    describe('When a user repays a full loan amount in behalf of another address', () => {
      it.todo(
        'Then it should be reflected in the positions from the other address',
      );
    });

    describe('When a user repays a loan in behalf of another address with a permit signature', () => {
      it.todo(
        `Then it should be reflected in the other user's borrow positions`,
      );
    });
  });
});
