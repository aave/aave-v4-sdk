import { userSupplies, withdraw } from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_USDC_ADDRESS,
  fundErc20Address,
  getBalance,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import type { Reserve } from '@aave/graphql-next';
import { assertOk, bigDecimal, evmAddress } from '@aave/types-next';
import { beforeAll, describe, expect, it } from 'vitest';
import { supplyToRandomERC20Reserve } from '../borrow/helper';

describe('Aave V4 Withdraw Scenario', () => {
  describe('Given a user with a supply position', () => {
    describe('When the user withdraws part of their supply', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          ETHEREUM_USDC_ADDRESS,
          evmAddress(user.account!.address),
          bigDecimal('200'),
          6,
        ).andThen(() =>
          supplyToRandomERC20Reserve(client, user, ETHEREUM_USDC_ADDRESS),
        );

        assertOk(setup);
        reserve = setup.value;
      });

      it('Then it should be reflected in the user supply positions', async () => {
        const balanceBefore = await getBalance(
          evmAddress(user.account!.address),
          ETHEREUM_USDC_ADDRESS,
        );
        console.log('balanceBefore', balanceBefore);

        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          amount: {
            erc20: { exact: bigDecimal('25') },
          },
          sender: evmAddress(user.account!.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
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
        assertOk(withdrawResult);
        const balanceAfter = await getBalance(
          evmAddress(user.account!.address),
          ETHEREUM_USDC_ADDRESS,
        );
        expect(balanceBefore + 25).toEqual(balanceAfter);
        expect(withdrawResult.value.length).toBe(1);
        expect(
          Number(withdrawResult.value[0]!.amount.value.formatted),
        ).toBeCloseTo(75, 3);
      });
    });

    describe('When the user withdraws all of their supply', () => {
      const user = createNewWallet();
      let reserve: Reserve;

      beforeAll(async () => {
        const setup = await fundErc20Address(
          ETHEREUM_USDC_ADDRESS,
          evmAddress(user.account!.address),
          bigDecimal('200'),
          6,
        ).andThen(() =>
          supplyToRandomERC20Reserve(client, user, ETHEREUM_USDC_ADDRESS),
        );

        assertOk(setup);
        reserve = setup.value;
      });
      it('Then it should be reflected in the user supply positions', async () => {
        const balanceBefore = await getBalance(
          evmAddress(user.account!.address),
          ETHEREUM_USDC_ADDRESS,
        );
        console.log('balanceBefore', balanceBefore);
        const withdrawResult = await withdraw(client, {
          reserve: {
            spoke: reserve.spoke.address,
            reserveId: reserve.id,
            chainId: reserve.chain.chainId,
          },
          sender: evmAddress(user.account!.address),
          amount: {
            erc20: {
              max: true,
            },
          },
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction)
          .andThen(() =>
            userSupplies(client, {
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
        assertOk(withdrawResult);
        const balanceAfter = await getBalance(
          evmAddress(user.account!.address),
          ETHEREUM_USDC_ADDRESS,
        );
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
        expect(withdrawResult.value.length).toBe(0);
      });
    });

    describe.skip('When the user withdraws tokens with a permit signature', () => {
      it.todo(
        'Then it should allow to withdraw tokens without needing for an ERC20 Approval transaction on the aToken',
      );
    });

    describe('When the user withdraws tokens specifying another address', () => {
      it.todo(
        `Then it should be reflected in the user's supply positions and the other address should receive the tokens`,
      );
    });

    describe.skip('When the user withdraws tokens specifying another address with a permit signature', () => {
      it.todo(
        'Then the user should receive the tokens and it should be reflected in their supply positions',
      );
    });
  });

  describe('Given a user with a supply position in a reserve that allows withdrawals in native tokens', () => {
    describe('When the user withdraws from the reserve in native tokens', () => {
      it.todo('Then the user should receive the amount in native tokens');
    });
  });
});
